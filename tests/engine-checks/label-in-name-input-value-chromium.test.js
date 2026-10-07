'use strict';

/**
 * label-in-name reads a button-type <input>'s value as its visible label
 * (#155): Chromium draws the value on the button (a longer value makes a
 * wider button), so <input type="submit" value="Go" aria-label="Search
 * site"> has the visible label "Go", which the name doesn't contain, as
 * for <button aria-label="Search site">Go</button>.
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

// [markup, the rule's outcome]
const CASES = [
  ['<input type="submit" value="Go" aria-label="Search site">', 'fail'],
  ['<input type="submit" value="Search" aria-label="Search site">', 'pass'],
  ['<input type="button" value="Reset form" aria-label="Clear">', 'fail'],
  ['<input type="submit" aria-label="Search site">', 'notApplicable'],
  ['<button aria-label="Search site">Go</button>', 'fail']
];

test('label-in-name reads a button-type input by its value, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('Chromium draws the value', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<input id="a" type="submit" value="Go"><br><input id="b" type="submit" value="Go Go Go Go">'
      );
      const [a, b] = await page.evaluate(() =>
        ['a', 'b'].map((id) => document.getElementById(id).offsetWidth)
      );
      assert.ok(b > a);
    } finally {
      await page.close();
    }
  });

  for (const [markup, outcome] of CASES) {
    await t.test(markup, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${markup}</main></body></html>`
        );
        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['label-in-name']).checksResults[0]
              .outcome
        );
        assert.equal(got, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
