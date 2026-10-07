'use strict';

/**
 * text-spacing-content-loss takes as clippers only the boxes on the text's
 * containing block chain, and counts contain: paint (#110). CSS Overflow 3
 * clips content "whose containing block is the box or a descendant of it":
 * an absolutely positioned popup whose containing block lies outside an
 * overflow: hidden box stays in view once the spacing makes it longer. Each
 * case's popup fits before the spacing and grows by a line with it. Layout
 * decides what is cut, so these tests run in Chromium.
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

const POP =
  '<div style="position:absolute;top:0;left:0;width:150px;line-height:1.2">This dropdown tooltip text wraps on lines</div>';
const box = (style, pop = POP) =>
  `<div style="position:relative;width:400px"><div style="height:40px;width:200px;${style}"><span>Menu</span>${pop}</div></div>`;

// [description, markup, outcome]
const CASES = [
  ['a static overflow: hidden box, the popup held outside it', box('overflow:hidden'), 'pass'],
  [
    'a positioned overflow: hidden box holds the popup',
    box('overflow:hidden;position:relative'),
    'fail'
  ],
  [
    'a transformed overflow: hidden box holds the popup',
    box('overflow:hidden;transform:translateX(0)'),
    'fail'
  ],
  [
    'a positioned wrapper inside a static overflow: hidden box',
    box('overflow:hidden', `<span style="position:relative">${POP}</span>`),
    'fail'
  ],
  ['a contain: paint box', box('contain:paint'), 'fail'],
  [
    'a fixed popup inside an overflow: hidden box',
    box('overflow:hidden', POP.replace('position:absolute;top:0', 'position:fixed;top:300px')),
    'pass'
  ]
];

test(
  'text-spacing-content-loss clips along the containing block chain, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, outcome] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Clipping</title></head><body>${markup}</body></html>`
          );
          await page.evaluate(BUNDLE);
          const r = await page.evaluate(
            () =>
              window.a11ycore
                .runa11yCoreInPage(location.href, null, {}, ['text-spacing-content-loss'])
                .checksResults.find((c) => c.ruleId === 'text-spacing-content-loss').outcome
          );
          assert.equal(r, outcome);
        } finally {
          await page.close();
        }
      });
    }
  }
);
