'use strict';

/**
 * ::first-line and ::first-letter paint part of the text in a colour of
 * their own. Which text that is depends on line breaks, so a pseudo-element
 * whose colour or background differs from the element's makes the contrast
 * not computable (cantTell, PSEUDO_ELEMENT_COLOR) instead of measuring the
 * wrong colour: #bbb text whose one line Chromium draws in black failed at
 * 1.92:1, and a light drop cap was never looked at. A page without such
 * rules is measured as before.
 *
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

// [css, markup, contrast-computable, contrast-minimum]
const CASES = [
  [
    '.f{color:#bbb} .f::first-line{color:#000}',
    '<p class="f">Short line</p>',
    'cantTell',
    'notApplicable'
  ],
  [
    '.d{color:#000} .d::first-letter{color:#ccc;font-size:3em}',
    '<p class="d">Once upon a time</p>',
    'cantTell',
    'notApplicable'
  ],
  // Found inside @media and in a nested rule as well as at the top.
  [
    '@media screen { .f{color:#bbb} .f::first-line{color:#000} }',
    '<p class="f">Short line</p>',
    'cantTell',
    'notApplicable'
  ],
  [
    '.f{color:#bbb; &::first-line{color:#000}}',
    '<p class="f">Short line</p>',
    'cantTell',
    'notApplicable'
  ],
  ['.f{color:#bbb}', '<p class="f">Short line</p>', 'pass', 'fail'],
  ['.f{color:#000} .f::first-line{font-weight:bold}', '<p class="f">Short line</p>', 'pass', 'pass']
];

test('::first-line and ::first-letter colours, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [css, body, computable, minimum] of CASES) {
    await t.test(css, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>body{background:#fff} ${css}</style></head><body><main>${body}</main></body></html>`
        );
        await addBundle(page);
        const got = await page.evaluate(() =>
          Object.fromEntries(
            window.a11ycore
              .runa11yCoreInPage(null, null, {}, ['contrast-computable', 'contrast-minimum'])
              .checksResults.map((c) => [c.ruleId, c.outcome])
          )
        );
        assert.equal(got['contrast-computable'], computable);
        assert.equal(got['contrast-minimum'], minimum);
      } finally {
        await page.close();
      }
    });
  }
});

// Where nothing else is in the way, the text is measured in its own colours
// and in the pseudo-element's: where both meet a rule's ratio it passes,
// where both fall short it fails, and only where they disagree is it asked
// about (contrast-computable asks where they disagree at the AA ratio or at
// the AAA one). [css, markup, computable, minimum, enhanced]
const BOTH_COLOURS = [
  // Both reach 7:1.
  [
    '.f{color:#000} .f::first-line{color:#222}',
    '<p class="f">Short line</p>',
    'pass',
    'pass',
    'pass'
  ],
  // Both below 3:1.
  [
    '.f{color:#bbb} .f::first-line{color:#ccc}',
    '<p class="f">Short line</p>',
    'pass',
    'fail',
    'fail'
  ],
  // Both reach 4.5:1, only one 7:1: decided for AA, asked about for AAA.
  [
    '.f{color:#000} .f::first-line{color:#666}',
    '<p class="f">Short line</p>',
    'cantTell',
    'pass',
    'notApplicable'
  ],
  // A large drop cap at 4.54:1 meets even the enhanced ratio for its size.
  [
    '.d{color:#000} .d::first-letter{color:#767676;font-size:3em}',
    '<p class="d">Once upon a time</p>',
    'pass',
    'pass',
    'pass'
  ],
  // Both pseudo-elements in colours of their own: which one paints the
  // first letter is not modelled, so it is asked about.
  [
    '.f{color:#000} .f::first-line{color:#111} .f::first-letter{color:#222}',
    '<p class="f">Short line</p>',
    'cantTell',
    'notApplicable',
    'notApplicable'
  ]
];

// link-in-text-block compares the link with the text around it in both
// colours. [css, markup, outcome, reason code]
const LINK_COLOURS = [
  // 3.57:1 and 4.07:1 from the text: told apart by color alone.
  [
    'a{display:inline-block;color:#c00} a::first-line{color:#d00}',
    'cantTell',
    'LINK_COLOR_CONTRAST_ONLY'
  ],
  // 3.57:1 in its own colour, 1.66:1 in the first line's: asked about.
  [
    'a{display:inline-block;color:#c00} a::first-line{color:#333}',
    'cantTell',
    'PSEUDO_ELEMENT_COLOR'
  ],
  // Below 3:1 in both.
  [
    'a{display:inline-block;color:#222} a::first-line{color:#333}',
    'fail',
    'COLOR_ONLY_DIFFERENTIATION'
  ]
];

// The paragraph's own ::first-line paints the text around the link on that
// line in a colour of its own: the link is compared with both.
// [css, markup, outcome, reason code, pseudo-element named]
const PARA = '<p>Read <a href="/x">the guide</a> now please.</p>';
const BLOCK_FIRST_LINE = [
  // 3.57:1 and 3.21:1 from the text: told apart by color alone.
  ['p::first-line{color:#111} a{color:#c00}', PARA, 'cantTell', 'LINK_COLOR_CONTRAST_ONLY'],
  // 3.57:1 from the text, 1.52:1 from the first line's: asked about.
  [
    'p::first-line{color:#900} a{color:#c00}',
    PARA,
    'cantTell',
    'PSEUDO_ELEMENT_COLOR',
    'p::first-line'
  ],
  // Below 3:1 from both.
  ['p::first-line{color:#333} a{color:#222}', PARA, 'fail', 'COLOR_ONLY_DIFFERENTIATION'],
  // Below 3:1 from both, but the first line is also bold, which may set
  // the link apart there.
  [
    'p::first-line{color:#333;font-weight:bold} a{color:#222}',
    PARA,
    'cantTell',
    'PSEUDO_ELEMENT_COLOR',
    'p::first-line'
  ],
  // Text in an inline element of a colour of its own keeps it on the first
  // line: compared with that colour alone, 3.57:1.
  [
    'p{color:#333} p::first-line{color:#900} span{color:#000} a{color:#c00}',
    '<p><span>Read</span> <a href="/x">the guide</a> <span>now please.</span></p>',
    'cantTell',
    'LINK_COLOR_CONTRAST_ONLY'
  ],
  // A first line in the paragraph's own colour changes nothing.
  ['p::first-line{color:#000} a{color:#222}', PARA, 'fail', 'COLOR_ONLY_DIFFERENTIATION'],
  // An ancestor's ::first-line paints the first line of the block that opens
  // it, through blocks between, whatever their own colour, and is named.
  [
    'div::first-line{color:#900} a{color:#c00}',
    `<div>${PARA}</div>`,
    'cantTell',
    'PSEUDO_ELEMENT_COLOR',
    'div::first-line'
  ],
  [
    'div.o::first-line{color:#900} p{color:#000} a{color:#c00}',
    `<div class="o"><section>${PARA}</section></div>`,
    'cantTell',
    'PSEUDO_ELEMENT_COLOR',
    'div.o::first-line'
  ],
  // A float before the paragraph is out of the flow: the paragraph still
  // opens the div's first line.
  [
    'div::first-line{color:#900} a{color:#c00} .f{float:left}',
    `<div><span class="f">x</span>${PARA}</div>`,
    'cantTell',
    'PSEUDO_ELEMENT_COLOR',
    'div::first-line'
  ],
  // The paragraph's own ::first-line wins over the div's: 3.21:1 from it.
  [
    'div::first-line{color:#900} p::first-line{color:#111} a{color:#c00}',
    `<div>${PARA}</div>`,
    'cantTell',
    'LINK_COLOR_CONTRAST_ONLY'
  ],
  // The div's first line is a heading's, or its own text's, not the
  // paragraph's: compared with the paragraph's colour alone.
  [
    'div::first-line{color:#900} a{color:#c00}',
    `<div><h2>Title</h2>${PARA}</div>`,
    'cantTell',
    'LINK_COLOR_CONTRAST_ONLY'
  ],
  [
    'div::first-line{color:#900} a{color:#c00}',
    `<div>Lead ${PARA}</div>`,
    'cantTell',
    'LINK_COLOR_CONTRAST_ONLY'
  ]
];

test(
  '::first-line and ::first-letter colours measured both ways, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (css, body, rules) => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>body{background:#fff;color:#000} ${css}</style></head><body><main>${body}</main></body></html>`
        );
        await addBundle(page);
        return await page.evaluate(
          (ids) =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ids).checksResults.map((c) => ({
              ruleId: c.ruleId,
              outcome: c.outcome,
              codes: c.occurrences.map(
                (o) => o.data && o.data.details && o.data.details.reasonCode
              ),
              pseudo: c.occurrences.map(
                (o) => (o.data && o.data.details && o.data.details.pseudoElement) || null
              )
            })),
          rules
        );
      } finally {
        await page.close();
      }
    };
    for (const [css, body, computable, minimum, enhanced] of BOTH_COLOURS) {
      await t.test(css, async () => {
        const got = Object.fromEntries(
          (
            await scan(css, body, ['contrast-computable', 'contrast-minimum', 'contrast-enhanced'])
          ).map((c) => [c.ruleId, c.outcome])
        );
        assert.equal(got['contrast-computable'], computable);
        assert.equal(got['contrast-minimum'], minimum);
        assert.equal(got['contrast-enhanced'], enhanced);
      });
    }
    for (const [css, outcome, code] of LINK_COLOURS) {
      await t.test(css, async () => {
        const [rule] = await scan(
          `a{text-decoration:none} ${css}`,
          '<p>Read <a href="/x">the guide</a> now please.</p>',
          ['link-in-text-block']
        );
        assert.equal(rule.outcome, outcome);
        assert.deepEqual(rule.codes, [code]);
      });
    }
    for (const [css, body, outcome, code, named] of BLOCK_FIRST_LINE) {
      await t.test(css, async () => {
        const [rule] = await scan(`a{text-decoration:none} ${css}`, body, ['link-in-text-block']);
        assert.equal(rule.outcome, outcome);
        assert.deepEqual(rule.codes, [code]);
        assert.deepEqual(rule.pseudo, [named || null]);
      });
    }
  }
);

// A variant of contrast-minimum at a ratio of its own: where the two colours
// disagree only at that ratio, contrast-computable, deciding at WCAG's,
// doesn't ask, so the variant does (PSEUDO_ELEMENT_COLOR). Where they
// disagree at WCAG's ratios too, contrast-computable asks and the variant
// leaves it. [css, computable, variant, variant's reason codes]
const { definePack, packScript } = require('../../src/pack.js');

const ratios = definePack({
  name: 'ratios',
  version: '1.0.0',
  namespace: 'ratios',
  core: '*',
  rules: [
    {
      id: 'ratios-contrast',
      from: 'contrast-minimum',
      config: { normalTextRatio: 5 },
      meta: {
        title: 'Contrast',
        tags: ['ratios'],
        i18n: { titleKey: 'ratiosContrast_title', descriptionKey: 'ratiosContrast_description' }
      }
    }
  ]
});
const VARIANT_COLOURS = [
  // 4.61:1 and 5.25:1: both reach 4.5:1 and neither 7:1, one reaches 5:1.
  ['.f{color:#757575} .f::first-line{color:#6c6c6c}', 'pass', 'cantTell', ['PSEUDO_ELEMENT_COLOR']],
  // 5.25:1 and 5.41:1: both reach 5:1.
  ['.f{color:#6c6c6c} .f::first-line{color:#6a6a6a}', 'pass', 'pass', ['ALL_ABOVE_THRESHOLD']],
  // 21:1 and 2.85:1: they disagree at WCAG's ratios, so it is asked there.
  ['.f{color:#000} .f::first-line{color:#999}', 'cantTell', 'notApplicable', []]
];

test("::first-line colours at a variant's own ratio, in Chromium", { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [css, computable, variant, codes] of VARIANT_COLOURS) {
    await t.test(css, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title><style>body{background:#fff;color:#000} ${css}</style></head><body><main><p class="f">Short line</p></main></body></html>`
        );
        await addBundle(page);
        await page.addScriptTag({ content: packScript([ratios]) });
        const got = await page.evaluate(() =>
          Object.fromEntries(
            window.a11ycore
              .runa11yCoreInPage(null, null, { packs: ['ratios@1.0.0'] }, [
                'contrast-computable',
                'contrast-minimum',
                'ratios-contrast'
              ])
              .checksResults.map((c) => [
                c.ruleId,
                {
                  outcome: c.outcome,
                  codes: c.occurrences.map((o) => o.data && o.data.details.reasonCode)
                }
              ])
          )
        );
        assert.equal(got['contrast-computable'].outcome, computable);
        assert.equal(got['ratios-contrast'].outcome, variant);
        assert.deepEqual(
          got['ratios-contrast'].codes.filter((c) => c),
          codes
        );
        // At WCAG's own ratios nothing changes.
        assert.notEqual(got['contrast-minimum'].outcome, 'cantTell');
      } finally {
        await page.close();
      }
    });
  }
});
