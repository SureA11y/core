'use strict';

/**
 * target-size-minimum on targets in a box a reader scrolls (overflow: auto
 * or scroll), in a real browser. Such a target is seen once scrolled into
 * the box, as the page's own scrolling shows what lies below the fold, so
 * it is measured whole, bounded only by the size of the box, and only the
 * boxes and targets inside the box are near it there. It was cut where the
 * box's edge is now (#177): a 40px button half past a list's edge failed as
 * 20px high, and targets out of view were measured against what lies
 * outside the list where they are now, or not at all. A box that hides its
 * overflow is scrolled by a script as often (a custom scrollbar, a virtual
 * list), and cuts no target either (#181); it only bounds a target's size. This needs a layout, which jsdom doesn't
 * have, so these tests run in Chromium.
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

const LINKS = (n, height, gap) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<a href="#${i}" style="display:block; width:120px; height:${height}px; line-height:${height}px; margin-bottom:${gap}px; font-size:12px">Item ${i + 1}</a>`
  ).join('');
const BUTTONS = (n, height) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<button style="display:block; width:100px; height:${height}px; margin:0">B${i + 1}</button>`
  ).join('');
const LIST = (content, overflow = 'auto', height = 100) =>
  `<div style="width:200px; max-height:${height}px; overflow:${overflow}">${content}</div>`;
const SMALL = (label) =>
  `<button style="width:60px; height:18px; margin-top:6px; padding:0; font-size:10px">${label}</button>`;

// [description, markup, outcome, how many targets fail]
const CASES = [
  [
    'a menu that shows 16px of its fourth 40px button, scrolling with overflow: auto',
    `<div style="width:300px; height:136px; overflow:auto">${BUTTONS(8, 40)}</div>`,
    'pass',
    0
  ],
  [
    'the same menu scrolled by a script with overflow: hidden',
    `<div style="width:300px; height:136px; overflow:hidden">${BUTTONS(8, 40)}</div>`,
    'pass',
    0
  ],
  ['40px buttons, one half past the edge of a list', LIST(BUTTONS(6, 40)), 'pass', 0],
  [
    'small links out of view, over a small button below the list',
    LIST(LINKS(10, 18, 12)) + SMALL('OK'),
    'pass',
    0
  ],
  [
    'links out of view, under a panel below the list',
    LIST(LINKS(10, 30, 0)) +
      '<div style="position:relative; height:200px; background:#eee">Panel</div>',
    'pass',
    0
  ],
  [
    "a dialog's buttons under the out-of-view options of a list over them",
    `<div style="position:relative; width:300px"><div style="padding:16px; border:1px solid"><input aria-label="State"><div style="height:120px"></div>${SMALL('Cancel')} ${SMALL('OK')}</div><div style="position:absolute; top:40px; left:16px; width:200px; max-height:80px; overflow:auto; background:#fff; z-index:10">${LINKS(12, 30, 0)}</div></div>`,
    'pass',
    0
  ],
  ['crowded small links, in view or not', LIST(LINKS(10, 16, 2)), 'fail', 10],
  [
    'a box that hides its overflow, scrolled by a script, measures the button past its edge whole',
    LIST(BUTTONS(6, 40), 'hidden'),
    'pass',
    0
  ],
  [
    'a button larger than a box hiding its overflow is measured as the box',
    `<div style="position:relative; width:200px"><div style="width:10px; height:10px; overflow:hidden"><button style="width:40px; height:40px; margin:0; padding:0">x</button></div><button style="position:absolute; top:0; left:12px; width:10px; height:10px; margin:0; padding:0">n</button></div>`,
    'fail',
    2
  ]
];

test('target-size-minimum on targets scrolled out of view, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, outcome, failed] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Scrolled</title></head><body><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const c = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'target-size-minimum'
          ]).checksResults[0];
          return { outcome: c.outcome, failed: c.occurrences.length };
        });
        assert.equal(r.outcome, outcome);
        assert.equal(r.failed, failed);
      } finally {
        await page.close();
      }
    });
  }
  await t.test('a button taller than its list is measured as high as the list', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>Scrolled</title></head><body><main><div style="display:flex; width:200px; max-height:20px; overflow:auto"><button id="t" style="width:22px; height:40px; margin:0; padding:0; flex:none">T</button><button style="width:10px; height:10px; margin:0; padding:0; flex:none">n</button></div></main></body></html>`
      );
      await page.evaluate(BUNDLE);
      const square = await page.evaluate(() => {
        const c = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
          'target-size-minimum'
        ]).checksResults[0];
        const o = c.occurrences.find((x) => x.selector === '#t');
        return o ? o.data.details.metrics.squarePx : null;
      });
      assert.equal(square, 20);
    } finally {
      await page.close();
    }
  });
});
