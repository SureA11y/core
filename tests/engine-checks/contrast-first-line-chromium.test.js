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
              codes: c.occurrences.map((o) => o.data && o.data.details && o.data.details.reasonCode)
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
  }
);
