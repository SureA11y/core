'use strict';

/**
 * Text is measured in the color it is painted in, -webkit-text-fill-color
 * (#112): currentcolor, so color, by default, inherited, and set by the
 * gradient and "clip text" effects. Each case's painted color was checked in
 * Chromium's pixels; these tests run there too.
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

const TEXT = 'Readable sample text';

// [description, markup, contrast-minimum's outcome, its ratio, or
// contrast-computable's reason]
const CASES = [
  [
    'a dark fill over a light color',
    `<p id="t" style="color:#eee;-webkit-text-fill-color:#000">${TEXT}</p>`,
    'pass',
    null
  ],
  [
    'a light fill over a transparent color',
    `<p id="t" style="color:transparent;-webkit-text-fill-color:#ccc">${TEXT}</p>`,
    'fail',
    1.61
  ],
  [
    'a light fill over a dark color',
    `<p id="t" style="color:#000;-webkit-text-fill-color:#ccc">${TEXT}</p>`,
    'fail',
    1.61
  ],
  [
    'a light fill inherited from the parent',
    `<div style="-webkit-text-fill-color:#ccc"><p id="t" style="color:#000">${TEXT}</p></div>`,
    'fail',
    1.61
  ],
  ['the default fill, currentcolor', `<p id="t" style="color:#ccc">${TEXT}</p>`, 'fail', 1.61],
  [
    'a translucent fill',
    `<p id="t" style="color:#eee;-webkit-text-fill-color:rgba(0,0,0,.5)">${TEXT}</p>`,
    'fail',
    3.95
  ],
  [
    'text filled with a gradient',
    `<p id="t" style="color:#000;background:linear-gradient(90deg,#f0f,#0ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${TEXT}</p>`,
    'notApplicable',
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ]
];

test('text is measured in its -webkit-text-fill-color, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, outcome, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Fill</title></head><body style="background:#fff">${markup}</body></html>`
        );
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'contrast-minimum',
            'contrast-computable'
          ]);
          const byId = (id) => res.checksResults.find((c) => c.ruleId === id);
          const min = byId('contrast-minimum');
          const o = (min.occurrences || [])[0];
          const comp = (byId('contrast-computable').occurrences || [])[0];
          return {
            outcome: min.outcome,
            ratio: o && o.data.details.metrics ? o.data.details.metrics.ratio : null,
            reason: comp ? comp.data.details.reasonCode : null
          };
        });
        assert.equal(r.outcome, outcome);
        if (typeof expected === 'number') assert.equal(Number(r.ratio.toFixed(2)), expected);
        if (typeof expected === 'string') assert.equal(r.reason, expected);
      } finally {
        await page.close();
      }
    });
  }
});
