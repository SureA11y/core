'use strict';

/**
 * A link's color under jsdom. jsdom ranks its own `:link { color: #0000EE }`
 * with the page's rules by specificity alone, so `a { color: #fff }` lost
 * to it and white link text on black was measured in blue, failing at
 * 2.23:1. Under jsdom the link's color is now worked out from the page's
 * rules, as a browser's cascade does (helpers.contrast,
 * __jsdomLinkTextColor), and these pages give the same results in jsdom
 * and in Chromium. Where jsdom can't work it out, the text is not
 * computable rather than measured in blue.
 *
 * The Chromium half is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
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
const RULES = ['contrast-minimum', 'contrast-computable', 'link-in-text-block'];
const DARK = 'body{background:#000;color:#fff}';
const LINK = '<p>Read the <a href="/x">annual report</a></p>';

const html = (css, body) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main>${body}</main></body></html>`;

function summarize(checksResults) {
  const out = {};
  for (const c of checksResults) {
    out[c.ruleId] = c.outcome;
    if (c.ruleId === 'contrast-minimum' && c.outcome === 'fail') {
      out.foreground = c.occurrences[0].data.details.colors.foregroundHex;
    }
  }
  return out;
}

// [name, css, markup, contrast-minimum, link-in-text-block, the color it fails in]
const CASES = [
  ['a type selector', `${DARK} a{color:#fff}`, LINK, 'pass', 'pass'],
  ['a descendant selector', `${DARK} p a{color:#fff}`, LINK, 'pass', 'pass'],
  [
    'text in an element inside the link',
    `${DARK} a{color:#fff}`,
    '<p>Read the <a href="/x"><span>annual report</span></a></p>',
    'pass',
    'pass'
  ],
  ['color: inherit', `${DARK} a{color:inherit}`, LINK, 'pass', 'pass'],
  ['a :hover rule', `${DARK} a{color:#fff} a:hover{color:#111}`, LINK, 'pass', 'pass'],
  ['a print rule', `${DARK} a{color:#fff} @media print{a{color:#111}}`, LINK, 'pass', 'pass'],
  // Among the page's own rules the more specific wins, and :where() adds
  // nothing, so there the later one does.
  [
    'a more specific rule',
    `${DARK} p a{color:#111} a{color:#fff}`,
    LINK,
    'fail',
    'pass',
    '#111111'
  ],
  ['a rule in :where()', `${DARK} :where(p) a{color:#111} a{color:#fff}`, LINK, 'pass', 'pass'],
  // A browser's link color where no author rule sets one.
  ['no rule for the link', DARK, LINK, 'fail', 'pass', '#0000ee'],
  [
    'an !important rule',
    `${DARK} a{color:#fff} .x{color:#333 !important}`,
    '<p>Read the <a class="x" href="/x">annual report</a></p>',
    'fail',
    'pass',
    '#333333'
  ],
  [
    'the style attribute',
    `${DARK} a{color:#fff}`,
    '<p>Read the <a href="/x" style="color:#222">annual report</a></p>',
    'fail',
    'pass',
    '#222222'
  ],
  // A fill the page sets paints the text, even in the browser's link
  // color, which jsdom also computes for a fill that follows color.
  [
    'a fill in the link color',
    `${DARK} a{color:#fff;-webkit-text-fill-color:#0000ee}`,
    LINK,
    'fail',
    'pass',
    '#0000ee'
  ],
  [
    'a fill in the link color, inherited',
    `${DARK} a{color:#fff} p{-webkit-text-fill-color:#0000ee}`,
    '<p>Read the <a href="/x">annual report</a></p><p>More text</p>',
    'fail',
    'pass',
    '#0000ee'
  ],
  [
    'a fill that follows color',
    `${DARK} a{color:#fff;-webkit-text-fill-color:currentcolor}`,
    LINK,
    'pass',
    'pass'
  ],
  // The same color as the text around it, and no underline.
  [
    'a link told apart by nothing',
    `${DARK} a{color:#fff;text-decoration:none}`,
    '<p>Read the <a href="/x">annual report</a> and more</p>',
    'pass',
    'fail'
  ]
];

const expected = ([, , , minimum, link, foreground]) => ({
  'contrast-minimum': minimum,
  'contrast-computable': 'pass',
  'link-in-text-block': link,
  ...(foreground ? { foreground } : {})
});

test('a link’s color from the page’s rules, in jsdom', () => {
  for (const c of CASES) {
    const result = runa11yCoreOnHtml(html(c[1], c[2]), { runOnly: RULES });
    assert.deepEqual(summarize(result.checksResults), expected(c), c[0]);
  }
});

test('in jsdom, a link color that can’t be worked out leaves the text not computable', () => {
  for (const css of [
    // A custom property jsdom doesn't substitute.
    `${DARK} a{color:var(--x)}`,
    // A condition jsdom doesn't evaluate.
    `${DARK} @supports (display:grid){a{color:#fff}}`
  ]) {
    const result = runa11yCoreOnHtml(html(css, LINK), { runOnly: RULES });
    const by = Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c]));
    assert.equal(by['contrast-computable'].outcome, 'cantTell', css);
    assert.deepEqual(
      by['contrast-computable'].occurrences.map((o) => o.data.details.reasonCode),
      ['FOREGROUND_UNPARSABLE'],
      css
    );
    assert.equal(by['contrast-minimum'].outcome, 'pass', css);
  }
});

test('a link’s color, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const c of CASES) {
    await t.test(c[0], async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(html(c[1], c[2]));
        await addBundle(page);
        const got = await page.evaluate(
          (rules) =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, rules).checksResults.map((r) => ({
              ruleId: r.ruleId,
              outcome: r.outcome,
              occurrences: r.occurrences.map((o) => ({ data: o.data }))
            })),
          RULES
        );
        assert.deepEqual(summarize(got), expected(c));
      } finally {
        await page.close();
      }
    });
  }
});
