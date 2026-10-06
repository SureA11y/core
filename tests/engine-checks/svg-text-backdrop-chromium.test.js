'use strict';

/**
 * SVG text is measured against the SVG shapes painted behind it (#96).
 *
 * SVG paints in document order, so a shape earlier than a text element and
 * under it is the text's background, which no CSS background shows. A <rect>
 * with a solid fill that covers all of the text is measured against; any
 * other shape under or over the text makes it not computable
 * (BACKGROUND_OVERLAP). This needs a layout, which jsdom doesn't have, so
 * these tests run in Chromium.
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

const svg = (inner) => `<svg width="200" height="40">${inner}</svg>`;
const LABEL = '<text x="10" y="25" fill="#ddd">Badge label</text>';

// [description, markup, contrast-minimum outcome, ratio or computable reason]
const CASES = [
  [
    'a dark rect behind light text',
    svg(`<rect width="200" height="40" fill="#000"/>${LABEL}`),
    'pass',
    15.46
  ],
  [
    'a #333 rect behind black text',
    svg(
      '<rect width="200" height="40" fill="#333"/><text x="10" y="25" fill="#000">Badge label</text>'
    ),
    'fail',
    1.66
  ],
  [
    'white text on a black rect, on a white page',
    svg(
      '<rect width="200" height="40" fill="#000"/><text x="10" y="25" fill="#fff">Badge label</text>'
    ),
    'pass',
    21
  ],
  [
    'a rect at fill-opacity 0.5',
    svg(
      '<rect width="200" height="40" fill="#000" fill-opacity="0.5"/><text x="10" y="25" fill="#fff">Badge label</text>'
    ),
    'fail',
    3.95
  ],
  [
    'a rect with rounded corners clear of the text',
    svg(`<rect width="200" height="40" rx="8" fill="#000"/>${LABEL}`),
    'pass',
    15.46
  ],
  [
    'a circle behind the text',
    svg(`<circle cx="60" cy="20" r="60" fill="#000"/>${LABEL}`),
    'notApplicable',
    'BACKGROUND_OVERLAP'
  ],
  [
    'a rect painted over the text',
    svg(`${LABEL}<rect width="200" height="40" fill="#000" fill-opacity="0.2"/>`),
    'notApplicable',
    'BACKGROUND_OVERLAP'
  ],
  [
    'a rect with a gradient fill',
    svg(
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#333"/></linearGradient></defs>' +
        `<rect width="200" height="40" fill="url(#g)"/>${LABEL}`
    ),
    'notApplicable',
    'BACKGROUND_OVERLAP'
  ],
  [
    'a rotated rect',
    svg(`<rect width="200" height="40" fill="#000" transform="rotate(5 100 20)"/>${LABEL}`),
    'notApplicable',
    'BACKGROUND_OVERLAP'
  ],
  [
    'a rect covering part of the text',
    svg(`<rect width="40" height="40" fill="#000"/>${LABEL}`),
    'notApplicable',
    'BACKGROUND_OVERLAP'
  ]
];

test('SVG text against the SVG shapes behind it, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, outcome, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>SVG badge</title></head><body style="background:#fff"><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'contrast-minimum',
            'contrast-enhanced',
            'contrast-computable'
          ]);
          const byId = (id) => res.checksResults.find((c) => c.ruleId === id);
          const onText = (c) => (c.occurrences || []).find((o) => / text$/.test(o.selector || ''));
          const min = byId('contrast-minimum');
          const enh = onText(byId('contrast-enhanced'));
          const comp = onText(byId('contrast-computable'));
          return {
            outcome: min.outcome,
            ratio: enh ? enh.data.details.metrics.ratio : null,
            reason: comp ? comp.data.details.reasonCode : null
          };
        });
        assert.equal(r.outcome, outcome);
        if (typeof expected === 'number') {
          // Below AAA, contrast-enhanced reports the ratio; at 21:1 nothing does.
          if (expected < 7) assert.equal(Number(r.ratio.toFixed(2)), expected);
          else assert.equal(r.reason, null);
        } else {
          assert.equal(r.reason, expected);
        }
      } finally {
        await page.close();
      }
    });
  }
});
