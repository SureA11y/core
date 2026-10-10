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
        await page.addScriptTag({ content: BUNDLE });
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
