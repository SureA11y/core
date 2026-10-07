'use strict';

/**
 * css-orientation-lock judges an orientation block's quarter turn on the
 * visible elements it turns (#109): none means nothing to judge (ACT
 * b33eff); the page's content (html, body, main or what holds it) fails;
 * any other element is asked about. Visibility is judged without the turn
 * itself, so <html> turned out of view is still the page; it needs a
 * layout, so these tests run in Chromium, in portrait and in landscape.
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

const BODY = '<main><h1>Title</h1><p>Page content with enough words to be the content.</p></main>';
const turn = (when, selector) =>
  `<style>@media (orientation: ${when}) { ${selector} { transform: rotate(90deg); transform-origin: top left } }</style>`;

// [description, markup, outcome]
const CASES = [
  ['a rule for a class nothing has', turn('portrait', '.none') + BODY, 'pass'],
  [
    'a rule for a hidden element',
    turn('portrait', '.h') + BODY + '<div class="h" hidden>x</div>',
    'pass'
  ],
  [
    'a rule for an element with no size',
    turn('portrait', '.h') + BODY + '<span class="h" style="display:inline-block"></span>',
    'pass'
  ],
  ['a rule turning main', turn('portrait', 'main') + BODY, 'fail'],
  ['a rule turning html out of view', turn('portrait', 'html') + BODY, 'fail'],
  ['a landscape rule turning main', turn('landscape', 'main') + BODY, 'fail'],
  [
    'a rule turning a small icon',
    turn('portrait', '.icon') +
      BODY +
      '<span class="icon" style="display:inline-block;width:10px;height:10px;background:#000"></span>',
    'cantTell'
  ]
];

test(
  'css-orientation-lock judges the elements a quarter turn applies to, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 }
    ]) {
      for (const [description, markup, outcome] of CASES) {
        await t.test(
          `${description} (${viewport.width > viewport.height ? 'landscape' : 'portrait'})`,
          async () => {
            const page = await browser.newPage({ viewport });
            try {
              await page.setContent(
                `<!doctype html><html lang="en"><head><title>Orientation</title></head><body>${markup}</body></html>`
              );
              await page.evaluate(BUNDLE);
              const r = await page.evaluate(
                () =>
                  window.a11ycore
                    .runa11yCoreInPage(location.href, null, {}, ['css-orientation-lock'])
                    .checksResults.find((c) => c.ruleId === 'css-orientation-lock').outcome
              );
              assert.equal(r, outcome);
            } finally {
              await page.close();
            }
          }
        );
      }
    }
  }
);
