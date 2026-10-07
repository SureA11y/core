'use strict';

/**
 * -webkit-text-stroke outlines each glyph in its own colour; a 2px black
 * stroke on 30px #ddd text is most of what Chromium draws, so the fill
 * colour alone is not the text's colour. The contrast is then not
 * computable (cantTell, TEXT_STROKE), as for a text-shadow, instead of a
 * confident fail at the fill's 1.36:1. A transparent or absent stroke
 * changes nothing.
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

// [stroke, contrast-computable, contrast-minimum]
const CASES = [
  ['2px #000', 'cantTell', 'notApplicable'],
  ['2px transparent', 'pass', 'fail'],
  ['', 'pass', 'fail']
];

test('-webkit-text-stroke makes contrast not computable, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [stroke, computable, minimum] of CASES) {
    await t.test(stroke || 'no stroke', async () => {
      const page = await browser.newPage();
      try {
        const style = `color:#ddd; font-size:30px; background:#fff${stroke ? '; -webkit-text-stroke:' + stroke : ''}`;
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><main><p style="${style}">Outlined heading</p></main></body></html>`
        );
        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(() => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [
            'contrast-computable',
            'contrast-minimum'
          ]);
          const by = Object.fromEntries(r.checksResults.map((c) => [c.ruleId, c]));
          const occ = by['contrast-computable'].occurrences[0];
          return {
            computable: by['contrast-computable'].outcome,
            minimum: by['contrast-minimum'].outcome,
            reason: occ && occ.data && occ.data.details ? occ.data.details.reasonCode : null
          };
        });
        assert.equal(got.computable, computable);
        assert.equal(got.minimum, minimum);
        if (computable === 'cantTell') assert.equal(got.reason, 'TEXT_STROKE');
      } finally {
        await page.close();
      }
    });
  }
});
