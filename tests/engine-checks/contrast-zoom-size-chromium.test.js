'use strict';

/**
 * Large text is judged by the size it is drawn at, as WCAG's "size when the
 * content is delivered": 12px text under CSS zoom: 2 lays out exactly like
 * 24px text in Chromium, and 10px SVG text in a viewBox scaled eight times
 * is drawn at 80px. #888 on white (3.54:1) passes as large text there, as
 * it does at 24px, and still fails at a plain 12px.
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

// [markup, contrast-minimum]
const CASES = [
  ['<p id="t" style="color:#888; font-size:12px; zoom:2">Zoomed text</p>', 'pass'],
  ['<p id="t" style="color:#888; font-size:24px">Large text</p>', 'pass'],
  ['<p id="t" style="color:#888; font-size:12px">Small text</p>', 'fail'],
  [
    '<svg viewBox="0 0 100 20" width="800"><text id="t" x="0" y="15" font-size="10" fill="#888">SVG</text></svg>',
    'pass'
  ]
];

test('large text is judged at its drawn size, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('zoom: 2 at 12px lays out as 24px', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<p id="a" style="font-size:12px; zoom:2">Zoomed text</p><p id="b" style="font-size:24px">Zoomed text</p>'
      );
      const [a, b] = await page.evaluate(() =>
        ['a', 'b'].map((id) => document.getElementById(id).getBoundingClientRect().height)
      );
      assert.equal(a, b);
    } finally {
      await page.close();
    }
  });

  for (const [markup, outcome] of CASES) {
    await t.test(markup, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
        );
        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum']).checksResults[0]
              .outcome
        );
        assert.equal(got, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
