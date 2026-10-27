'use strict';

/**
 * Text is judged by the size it is drawn at, and font-size-adjust draws a
 * font at another size than its font-size: the font's own aspect (x-height
 * over size, by default) is scaled to the adjust value. 24px text under
 * font-size-adjust: 0.3 is drawn at about 14px in a font whose x-height is
 * half its size, so it is not large text, and #949494 on white (3.03:1)
 * fails; 18px under 0.95 is drawn at about 34px, large, and passes. The
 * finding says so when the drawn size changes the threshold. p-as-heading
 * judges the drawn size too, under font-size-adjust and zoom.
 *
 * The cases hold for any font whose x-height is 0.4 to 0.6 of its size.
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');

const FONT = 'font-family:sans-serif';

// [markup, contrast-minimum, contrast-enhanced]
const CONTRAST = [
  [`<p id="t" style="${FONT};color:#949494;font-size:24px">Large text</p>`, 'pass', 'fail'],
  [
    `<p id="t" style="${FONT};color:#949494;font-size:24px;font-size-adjust:0.3">Drawn small</p>`,
    'fail',
    'fail'
  ],
  [
    `<p id="t" style="${FONT};color:#949494;font-size:18px;font-size-adjust:0.95">Drawn large</p>`,
    'pass',
    'fail'
  ],
  [
    `<p id="t" style="${FONT};color:#949494;font-size:24px;font-size-adjust:from-font">From the font</p>`,
    'pass',
    'fail'
  ],
  [
    `<p id="t" style="${FONT};color:#757575;font-size:18px;font-size-adjust:cap-height 1.4">Cap height</p>`,
    'pass',
    'pass'
  ]
];

async function scan(browser, markup, rule) {
  const page = await browser.newPage();
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
    );
    await addBundle(page);
    return await page.evaluate(
      (rule) => window.a11ycore.runa11yCoreInPage(null, null, {}, [rule]).checksResults[0],
      rule
    );
  } finally {
    await page.close();
  }
}

test('text is judged at the size font-size-adjust draws it, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  await t.test('the size the engine reports is the size the text is drawn at', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<span id="a" style="${FONT};color:#949494;font-size:24px;font-size-adjust:0.3">Drawn text</span>`
      );
      await addBundle(page);
      const [size, widths] = await page.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum']);
        const size = r.checksResults[0].occurrences[0].data.details.typography.fontSizePx;
        // The same text at that size, without the adjust, is as wide.
        const a = document.getElementById('a');
        const b = document.createElement('span');
        b.textContent = a.textContent;
        b.style.cssText = `font-family:${getComputedStyle(a).fontFamily};font-size:${size}px`;
        document.body.append(b);
        const widths = [a, b].map((el) => el.getBoundingClientRect().width);
        b.remove();
        return [size, widths];
      });
      assert.ok(size > 12 && size < 19, `drawn at ${size}px`);
      assert.ok(Math.abs(widths[0] - widths[1]) < 0.5, `widths ${widths[0]} and ${widths[1]}`);
    } finally {
      await page.close();
    }
  });

  for (const [markup, minimum, enhanced] of CONTRAST) {
    await t.test(markup, async () => {
      assert.equal((await scan(browser, markup, 'contrast-minimum')).outcome, minimum);
      assert.equal((await scan(browser, markup, 'contrast-enhanced')).outcome, enhanced);
    });
  }

  await t.test('a failure the drawn size decides says so', async () => {
    const r = await scan(browser, CONTRAST[1][0], 'contrast-minimum');
    const occ = r.occurrences[0];
    const typo = occ.data.details.typography;
    assert.equal(typo.declaredFontSizePx, 24);
    assert.deepEqual(typo.sizeScaledBy, ['font-size-adjust']);
    assert.equal(typo.isLargeText, false);
    assert.ok(typo.fontSizePx < 19);
    assert.equal(occ.i18n.hintKey, 'contrast_hint_drawnSize');
    assert.match(occ.hint, /^Its font-size is 24px, but font-size-adjust draws it at [\d.]+px/);
    assert.match(occ.hint, /not large text, which needs 4\.5:1/);
  });

  await t.test('a failure the drawn size doesn’t decide keeps its hint', async () => {
    const markup = `<p id="t" style="${FONT};color:#bbb;font-size:24px;font-size-adjust:0.3">Light</p>`;
    // Below 3:1, it fails at either size.
    const r = await scan(
      browser,
      markup.replace('font-size-adjust:0.3', 'font-size-adjust:0.6'),
      'contrast-minimum'
    );
    const occ = r.occurrences[0];
    assert.equal(occ.i18n.hintKey, 'contrastMinimum_hint_fail');
    assert.deepEqual(occ.data.details.typography.sizeScaledBy, ['font-size-adjust']);
  });

  await t.test('p-as-heading judges the drawn size', async () => {
    const bold = (style) =>
      `<p style="${FONT};font-weight:700;${style}">A short line of bold text</p><p>Body text.</p>`;
    assert.equal((await scan(browser, bold('font-size:24px'), 'p-as-heading')).outcome, 'cantTell');
    assert.equal(
      (await scan(browser, bold('font-size:24px;font-size-adjust:0.3'), 'p-as-heading')).outcome,
      'notApplicable'
    );
    assert.equal(
      (await scan(browser, bold('font-size:12px;zoom:2'), 'p-as-heading')).outcome,
      'cantTell'
    );
  });
});
