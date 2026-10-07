'use strict';

/**
 * td-has-header leaves out tables with spans, and rowspan="0" is one (#120):
 * the cell grows down to the end of its row group (HTML, forming a table).
 * Each case is checked against Chromium's layout: how many rows the <th>
 * spans, and whether the cells of the rows below it sit to its right.
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

const rows = (n, from) =>
  Array.from(
    { length: n },
    (_, r) => `<tr><td${r === 0 ? ' id="x"' : ''}>${from}${r}a</td><td>b</td><td>c</td></tr>`
  ).join('');

// [description, table markup, rows the <th> spans, the outcome]
const CASES = [
  [
    'rowspan="0"',
    `<table><tr><th id="h" rowspan="0">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3, 'r')}</table>`,
    4,
    'notApplicable'
  ],
  [
    'rowspan=" 0 "',
    `<table><tr><th id="h" rowspan=" 0 ">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3, 'r')}</table>`,
    4,
    'notApplicable'
  ],
  [
    'rowspan="0x"',
    `<table><tr><th id="h" rowspan="0x">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3, 'r')}</table>`,
    4,
    'notApplicable'
  ],
  [
    'rowspan="0" in the first of two row groups',
    `<table><tbody><tr><th id="h" rowspan="0">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(1, 'r')}</tbody><tbody><tr><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><td>5</td><td>6</td><td>7</td><td>8</td></tr></tbody></table>`,
    2,
    'notApplicable'
  ],
  [
    'rowspan="1"',
    `<table><tr><th id="h" rowspan="1">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3, 'r')}</table>`,
    1,
    'fail'
  ]
];

test('td-has-header takes rowspan="0" for a span, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, spanned, outcome] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Tables</title></head><body><main>${markup}</main></body></html>`
        );
        const layout = await page.evaluate(() => {
          const h = document.getElementById('h').getBoundingClientRect();
          const x = document.getElementById('x').getBoundingClientRect();
          const spanned = [...document.querySelectorAll('tr')].filter((r) => {
            const b = r.getBoundingClientRect();
            return b.top >= h.top - 1 && b.bottom <= h.bottom + 1;
          }).length;
          return { spanned, rightOfHeader: x.left >= h.right - 1 };
        });
        assert.equal(layout.spanned, spanned);
        assert.equal(layout.rightOfHeader, spanned > 1);

        await page.evaluate(BUNDLE);
        const r = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['td-has-header'])
              .checksResults[0].outcome
        );
        assert.equal(r, outcome);
      } finally {
        await page.close();
      }
    });
  }
});
