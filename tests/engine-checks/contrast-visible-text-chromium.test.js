'use strict';

/**
 * In a browser, the contrast rules check the text a reader can see (#99).
 *
 * With no visibilityMode set, a page with a layout is scanned in
 * 'styleAndGeometry': text off the page or clipped away by an ancestor is
 * drawn nowhere it can be seen, so it isn't checked. A <select>'s options
 * have no layout box of their own but are drawn (the selected one in the
 * closed control, the others in the list it opens), so they are checked, as
 * text below the fold is. jsdom has no layout, so these tests run in
 * Chromium.
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

const FAINT = 'color:#ddd';

// [description, markup, engineOptions, whether #t is failed]
const CASES = [
  [
    'off-page text (left: -9999px) is not checked',
    `<span id="t" style="position:absolute; left:-9999px; ${FAINT}">Skip to content</span>`,
    {},
    false
  ],
  [
    'text clipped away (height: 0; overflow: hidden) is not checked',
    `<div style="height:0; overflow:hidden"><span id="t" style="${FAINT}">Hidden panel text</span></div>`,
    {},
    false
  ],
  [
    "with visibilityMode: 'styleOnly', off-page text is checked as before",
    `<span id="t" style="position:absolute; left:-9999px; ${FAINT}">Skip to content</span>`,
    { visibilityMode: 'styleOnly' },
    true
  ],
  [
    'text below the fold is checked',
    `<div style="height:3000px"></div><span id="t" style="${FAINT}">Footer note</span>`,
    {},
    true
  ],
  [
    "a closed select's faint selected value is checked",
    `<select id="t" style="${FAINT}"><option>Spain</option><option>France</option></select>`,
    {},
    true
  ],
  [
    "a closed select's faint unselected option is checked: the open list draws it",
    `<select><option>Spain</option><option id="t" style="${FAINT}">France</option></select>`,
    {},
    true
  ],
  [
    "with visibilityMode: 'styleAndGeometry', a select's options are checked",
    `<select id="t" style="${FAINT}"><option>Spain</option></select>`,
    { visibilityMode: 'styleAndGeometry' },
    true
  ],
  [
    'a select off the page is not checked',
    `<select style="position:absolute; left:-9999px"><option id="t" style="${FAINT}">Spain</option></select>`,
    {},
    false
  ]
];

test('the contrast rules check the text a reader can see, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, engineOptions, failed] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Visible text</title></head><body style="background:#fff"><main><p>Visible text</p>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        // The only other text on the page is black on white, so the rule
        // fails exactly when #t is failed.
        const r = await page.evaluate((options) => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, options, [
            'contrast-minimum'
          ]);
          const c = res.checksResults[0];
          return { outcome: c.outcome, count: (c.occurrences || []).length };
        }, engineOptions);
        assert.equal(r.outcome === 'fail', failed, JSON.stringify(r));
      } finally {
        await page.close();
      }
    });
  }
});
