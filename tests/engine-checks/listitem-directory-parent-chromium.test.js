'use strict';

/**
 * role="directory" is a list item's parent (#149). WAI-ARIA 1.2 lists
 * directory, deprecated but valid, among listitem's required context roles,
 * and Chromium exposes it as a list. listitem-parent-valid and
 * aria-required-parent accept it; aria-deprecated-role still flags the
 * deprecated role.
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

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

const CASES = [
  ['<ol role="directory"><li>a</li></ol>', 'listitem-parent-valid'],
  ['<ul role="directory"><li>a</li></ul>', 'listitem-parent-valid'],
  ['<div role="directory"><div role="listitem">a</div></div>', 'aria-required-parent']
];

test('role="directory" is a list item’s parent, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [markup, ruleId] of CASES) {
    await t.test(markup, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${markup}</main></body></html>`
        );
        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const roles = nodes.filter((n) => !n.ignored).map((n) => n.role.value);
        assert.ok(
          roles.includes('list') && roles.includes('listitem'),
          'Chromium: a list item in a list'
        );

        await page.addScriptTag({ content: BUNDLE });
        const outcomes = await page.evaluate(
          (id) =>
            Object.fromEntries(
              window.a11ycore
                .runa11yCoreInPage(null, null, {}, [id, 'aria-deprecated-role'])
                .checksResults.map((c) => [c.ruleId, c.outcome])
            ),
          ruleId
        );
        assert.equal(outcomes[ruleId], 'pass');
        assert.equal(outcomes['aria-deprecated-role'], 'cantTell');
      } finally {
        await page.close();
      }
    });
  }
});
