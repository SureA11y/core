'use strict';

/**
 * Text drawn only by an outline or a shadow: a transparent fill, or a fill
 * the color of the background, with a visible -webkit-text-stroke or
 * text-shadow. Outlined headings are a common design. Under ACT's
 * definition the text is visible, since making it transparent changes the
 * pixels, and WCAG's techniques count an outline or halo in its contrast
 * (G18, G145). The engine skipped it as undrawn, or as the same color as
 * its background, before looking at the stroke or shadow, so a #ccc
 * outline on white (1.61:1) passed in silence. It now gets the review a
 * stroke or shadow gets elsewhere (contrast-computable, TEXT_STROKE or
 * TEXT_SHADOW), except where every color it is drawn in is below the
 * ratio against a flat background: no reading of it can meet the
 * criterion (ACT: "guaranteed to not be satisfied"), so the ratio rules
 * fail it by the best of those colors. The same holds for a light fill
 * with a light outline: the fill counts among the colors. Text nothing
 * draws is still skipped.
 *
 * jsdom has no -webkit-text-stroke, so stroke cases run in Chromium, and
 * are skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

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
const RULES = ['contrast-minimum', 'contrast-enhanced', 'contrast-computable'];

const page = (style) =>
  '<!doctype html><html lang="en" style="background:#fff"><head><title>t</title></head>' +
  `<body style="background:#fff"><main><h2 style="font-size:32px;${style}">Outlined heading</h2></main></body></html>`;

function summarize(checksResults) {
  const out = {};
  for (const c of checksResults) {
    out[c.ruleId] = c.outcome;
    if (c.ruleId === 'contrast-computable' && c.outcome === 'cantTell') {
      out.reason = (JSON.stringify(c.occurrences).match(/TEXT_STROKE|TEXT_SHADOW/) || [null])[0];
    }
  }
  return out;
}

const ASKED = (reason) => ({
  'contrast-minimum': 'notApplicable',
  'contrast-enhanced': 'notApplicable',
  'contrast-computable': 'cantTell',
  reason
});
// Every color the text is drawn in is below even AA's ratio: no reading of
// it meets the criterion, so both ratio rules fail it, and
// contrast-computable doesn't ask about it too.
const FAILED = {
  'contrast-minimum': 'fail',
  'contrast-enhanced': 'fail',
  'contrast-computable': 'pass'
};
// Between AA's and AAA's ratio: AAA fails it, and whether it is legible
// enough for AA is asked.
const BETWEEN = (reason) => ({
  'contrast-minimum': 'notApplicable',
  'contrast-enhanced': 'fail',
  'contrast-computable': 'cantTell',
  reason
});
const SKIPPED = {
  'contrast-minimum': 'notApplicable',
  'contrast-enhanced': 'notApplicable',
  'contrast-computable': 'notApplicable'
};

// [name, style, expected]
const CASES = [
  [
    'a transparent fill with a light stroke',
    'color:transparent;-webkit-text-stroke:1px #ccc',
    FAILED
  ],
  ['a white fill on white with a light stroke', 'color:#fff;-webkit-text-stroke:1px #ccc', FAILED],
  [
    'a transparent fill with a dark stroke',
    'color:transparent;-webkit-text-stroke:1px #000',
    ASKED('TEXT_STROKE')
  ],
  ['a transparent fill with a shadow', 'color:transparent;text-shadow:0 0 0 #ccc', FAILED],
  ['a white fill on white with a shadow', 'color:#fff;text-shadow:1px 1px 0 #ccc', FAILED],
  [
    'a transparent fill with a mid-grey stroke',
    'color:transparent;-webkit-text-stroke:1px #8a8a8a',
    BETWEEN('TEXT_STROKE')
  ],
  ['a transparent fill and nothing else', 'color:transparent', SKIPPED],
  ['a white fill on white and nothing else', 'color:#fff', SKIPPED],
  [
    'a transparent fill with a transparent shadow',
    'color:transparent;text-shadow:0 0 2px transparent',
    SKIPPED
  ],
  [
    'a transparent fill with a transparent stroke',
    'color:transparent;-webkit-text-stroke:1px transparent',
    SKIPPED
  ],
  ['a light fill with a light stroke', 'color:#eee;-webkit-text-stroke:1px #ccc', FAILED],
  ['a light fill with a light shadow', 'color:#eee;text-shadow:0 0 1px #ccc,0 0 1px #ccc', FAILED],
  [
    'a light fill with a dark stroke',
    'color:#eee;-webkit-text-stroke:1px #000',
    ASKED('TEXT_STROKE')
  ],
  [
    'a dark fill with a light stroke',
    'color:#000;-webkit-text-stroke:1px #eee',
    ASKED('TEXT_STROKE')
  ]
];

async function scan(browser, html) {
  const p = await browser.newPage();
  try {
    await p.setContent(html);
    await addBundle(p);
    return await p.evaluate(
      (rules) =>
        window.a11ycore.runa11yCoreInPage(location.href, null, {}, { includeRuleIds: rules })
          .checksResults,
      RULES
    );
  } finally {
    await p.close();
  }
}

test('text drawn by an outline, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [name, style, expected] of CASES) {
    await t.test(name, async () => {
      assert.deepEqual(summarize(await scan(browser, page(style))), expected);
    });
  }

  // A placeholder is judged by whose colors it is drawn in, so a light
  // one with a light shadow is still asked about.
  await t.test('a light placeholder with a light shadow', async () => {
    const got = await scan(
      browser,
      '<!doctype html><html lang="en"><head><title>t</title><style>' +
        'input::placeholder{color:#eee;text-shadow:0 0 1px #ccc}</style></head>' +
        '<body><main><label>Search <input placeholder="Type a word"></label></main></body></html>'
    );
    const by = Object.fromEntries(got.map((c) => [c.ruleId, c]));
    assert.notEqual(by['contrast-minimum'].outcome, 'fail');
    assert.equal(by['contrast-computable'].outcome, 'cantTell');
  });
});

test('in jsdom, a shadow on a fill the color of the background or a light fill is measured or asked about, and no shadow is skipped', () => {
  const light = runa11yCoreOnHtml(page('color:#fff;text-shadow:1px 1px 0 #ccc'), {
    runOnly: RULES
  });
  assert.deepEqual(summarize(light.checksResults), FAILED);
  const dark = runa11yCoreOnHtml(page('color:#fff;text-shadow:1px 1px 0 #000'), { runOnly: RULES });
  assert.deepEqual(summarize(dark.checksResults), ASKED('TEXT_SHADOW'));
  const lightFill = runa11yCoreOnHtml(page('color:#eee;text-shadow:1px 1px 0 #ccc'), {
    runOnly: RULES
  });
  assert.deepEqual(summarize(lightFill.checksResults), FAILED);
  const plain = runa11yCoreOnHtml(page('color:#fff'), { runOnly: RULES });
  assert.deepEqual(summarize(plain.checksResults), SKIPPED);
});

// A variant of contrast-minimum at a lower ratio than WCAG's: an outline
// whose best color reaches it but not WCAG's AA ratio is left by
// contrast-computable to the ratio rules, and the variant can't decide it,
// so it asks (TEXT_STROKE). At WCAG's ratios it still fails.
const { definePack, packScript } = require('../../src/pack.js');

const lowRatio = definePack({
  name: 'ratios',
  version: '1.0.0',
  namespace: 'ratios',
  core: '*',
  rules: [
    {
      id: 'ratios-contrast',
      from: 'contrast-minimum',
      config: { largeTextRatio: 2.5 },
      meta: {
        title: 'Contrast',
        tags: ['ratios'],
        i18n: { titleKey: 'ratiosContrast_title', descriptionKey: 'ratiosContrast_description' }
      }
    }
  ]
});

test("an outline at a variant's own ratio, in Chromium", { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  // [stroke, contrast-minimum, variant, variant's reason code]
  for (const [stroke, minimum, variant, code] of [
    // 2.85:1: below 3:1, above 2.5:1.
    ['#999', 'fail', 'cantTell', 'TEXT_STROKE'],
    // 1.61:1: below both.
    ['#ccc', 'fail', 'fail', 'BELOW_THRESHOLD']
  ]) {
    await t.test(stroke, async () => {
      const p = await browser.newPage();
      try {
        await p.setContent(page(`color:transparent;-webkit-text-stroke:1px ${stroke}`));
        await addBundle(p);
        await p.addScriptTag({ content: packScript([lowRatio]) });
        const got = await p.evaluate(() =>
          Object.fromEntries(
            window.a11ycore
              .runa11yCoreInPage(null, null, { packs: ['ratios@1.0.0'] }, [
                'contrast-computable',
                'contrast-minimum',
                'ratios-contrast'
              ])
              .checksResults.map((c) => [
                c.ruleId,
                { outcome: c.outcome, code: c.occurrences[0].data.details.reasonCode }
              ])
          )
        );
        assert.equal(got['contrast-computable'].outcome, 'pass');
        assert.equal(got['contrast-minimum'].outcome, minimum);
        assert.equal(got['ratios-contrast'].outcome, variant);
        assert.equal(got['ratios-contrast'].code, code);
      } finally {
        await p.close();
      }
    });
  }
});
