'use strict';

/**
 * skip-link in a real browser, where it also measures the link's target: a
 * target that collapses to nothing below a breakpoint is reported at that
 * width only, and the finding says which viewport it was measured at.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const RULE_ID = 'skip-link';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  @media (max-width: 600px) { #main { height: 0; overflow: hidden } }
</style></head><body>
  <a id="skip" href="#main">Skip to main content</a>
  <nav><a href="/a">A</a> <a href="/b">B</a></nav>
  <main id="main"><h1>Title</h1><p>Content</p></main>
</body></html>`;

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(viewport) {
    const p = await browser.newPage({ viewport });
    try {
      await p.setContent(PAGE);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
        RULE_ID
      );
      return result.checksResults.find((r) => r.ruleId === RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('a target that collapses below a breakpoint, with its viewport', async () => {
    const wide = await scan({ width: 1024, height: 700 });
    assert.equal(wide.occurrences.length, 0);

    const narrow = await scan({ width: 500, height: 700 });
    assert.equal(narrow.outcome, 'cantTell');
    const { details } = narrow.occurrences[0].data;
    assert.equal(details.reasonCode, 'SKIP_LINK_TARGET_UNUSABLE');
    assert.equal(details.unusableReasonCode, 'ZERO_AREA_TARGET');
    assert.deepEqual(details.viewport, { width: 500, height: 700 });
  });
});
