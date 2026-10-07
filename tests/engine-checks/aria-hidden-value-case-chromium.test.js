'use strict';

/**
 * aria-hidden-focus reads aria-hidden="true" in any case, trimmed (#148).
 * Each value is checked against Chromium's accessibility tree: where
 * Chromium leaves the button out, the rule fails it; aria-hidden="false"
 * leaves it in, and the rule doesn't apply. "yes" is not a valid value and
 * stays out of scope, though Chromium hides it as well.
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

// [aria-hidden value, the outcome the rule gives]
const CASES = [
  ['true', 'fail'],
  ['TRUE', 'fail'],
  ['True', 'fail'],
  [' true ', 'fail'],
  ['false', 'notApplicable']
];

test('aria-hidden-focus reads aria-hidden="true" in any case, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [value, outcome] of CASES) {
    await t.test(JSON.stringify(value), async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p>' +
            `<div aria-hidden="${value}"><button>Close</button></div></main></body></html>`
        );
        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const exposed = nodes.some((n) => !n.ignored && n.role && n.role.value === 'button');
        assert.equal(
          exposed,
          outcome !== 'fail',
          'Chromium hides the button where the rule fails it'
        );

        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['aria-hidden-focus'])
              .checksResults[0].outcome
        );
        assert.equal(got, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
