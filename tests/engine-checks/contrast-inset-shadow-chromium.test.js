'use strict';

/**
 * An inset box-shadow is painted over an element's background, under its
 * content: `inset 0 0 0 100vmax rgba(0,0,0,.6)` darkens a card under its
 * title. One whose spread fills the whole padding box is a color composited
 * over that box's background, like a background color; one that paints
 * under part of the text (a vignette reaching it) stops the measurement
 * (BACKGROUND_IMAGE_OR_GRADIENT, blocker box-shadow), and one whose hole the
 * text sits clear of (a 1px highlight along a button's edge) changes
 * nothing. Round 8, LY-1. Where a shadow reaches takes a layout, so these
 * run in Chromium.
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

// [description, markup, expected { minimum, computable, ratio?, reason?, property? }]
const CASES = [
  [
    'a translucent shadow over a white card darkens it under the title',
    `<a href="#" style="display:block;width:300px;height:120px;background:#fff;box-shadow:inset 0 0 0 100vmax rgba(0,0,0,.6)"><span style="color:#555">Card title over a darkening overlay</span></a>`,
    { minimum: 'fail', computable: 'pass', ratio: 1.3 }
  ],
  [
    'dark text on an opaque black shadow fails',
    `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#333">Dark on inset shadow</p></div>`,
    { minimum: 'fail', computable: 'pass', ratio: 1.66 }
  ],
  [
    'white text on an opaque black shadow passes',
    `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px"><p style="color:#fff">White on inset shadow</p></div>`,
    { minimum: 'pass', computable: 'pass' }
  ],
  [
    'a vignette reaching the text is asked about',
    `<div style="background:#fff;padding:2px;box-shadow:inset 0 0 20px #000"><p style="margin:0;color:#555">Vignette text</p></div>`,
    {
      minimum: 'notApplicable',
      computable: 'cantTell',
      reason: 'BACKGROUND_IMAGE_OR_GRADIENT',
      property: 'box-shadow'
    }
  ],
  [
    'a 1px highlight along the edge the text is clear of changes nothing',
    `<button style="background:#fff;color:#000;padding:8px;border:0;box-shadow:inset 0 1px 0 rgba(0,0,0,.5)">Go</button>`,
    { minimum: 'pass', computable: 'pass' }
  ]
];

test('contrast: an inset box-shadow painted as a background, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Inset shadow</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const res = await page.evaluate(() => {
          const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'contrast-minimum',
            'contrast-computable'
          ]);
          const out = {};
          for (const c of r.checksResults) {
            const d = (c.occurrences[0] && c.occurrences[0].data.details) || {};
            out[c.ruleId] = {
              outcome: c.outcome,
              ratio: d.metrics ? d.metrics.ratio : null,
              reason: d.reasonCode || null,
              property: d.blockerProperty || null,
              summary: (c.occurrences[0] && c.occurrences[0].summary) || ''
            };
          }
          return out;
        });
        assert.equal(res['contrast-minimum'].outcome, expected.minimum);
        assert.equal(res['contrast-computable'].outcome, expected.computable);
        if (expected.ratio != null)
          assert.ok(
            Math.abs(res['contrast-minimum'].ratio - expected.ratio) < 0.02,
            `ratio ${res['contrast-minimum'].ratio}`
          );
        if (expected.reason) {
          assert.equal(res['contrast-computable'].reason, expected.reason);
          assert.equal(res['contrast-computable'].property, expected.property);
          assert.match(res['contrast-computable'].summary, /inset box-shadow/);
        }
      } finally {
        await page.close();
      }
    });
  }
});
