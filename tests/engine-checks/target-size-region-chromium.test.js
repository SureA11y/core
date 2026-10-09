'use strict';

/**
 * target-size-minimum measures the region a pointer can hit, not the
 * bounding box (#105). A target is the "region of the display that will
 * accept a pointer action" (WCAG 2.2, target), and nothing painted over it
 * takes from it, as what covers a target depends on the moment of the
 * scan; it is large enough when a 24 by 24 square aligned to the page
 * fits inside it, so rounded corners and a rotation count (Understanding
 * 2.5.8), and its spacing circle is centred on that region's bounding box.
 * Each case's region is what Chromium's hit-testing gives, so these tests
 * run in Chromium.
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

const BTN = 'display:inline-block;padding:0;border:0;margin:0;position:absolute;';
// A 10×10 button beside the target.
const near = (left, top = 100) =>
  `<button id="n" style="${BTN}width:10px;height:10px;top:${top}px;left:${left}px">n</button>`;

// [description, markup, what the rule reports on #t ('fail', or null for
// nothing), the side of the largest square that fits (squarePx), or, with
// nothing reported, the margin's value on #t (null when it isn't the margin)]
const CASES = [
  [
    'a 40×40 button clipped to 10×10 by overflow: hidden',
    `<div style="width:10px;height:10px;overflow:hidden;position:absolute;top:100px;left:100px"><button id="t" style="${BTN}width:40px;height:40px;top:0;left:0">x</button></div>${near(115)}`,
    'fail',
    10
  ],
  [
    'the same, clipped by clip-path: inset()',
    `<button id="t" style="${BTN}width:40px;height:40px;top:100px;left:100px;clip-path:inset(0 30px 30px 0)">x</button>${near(115)}`,
    'fail',
    10
  ],
  [
    'the same, clipped by contain: paint',
    `<div style="width:10px;height:10px;contain:paint;position:absolute;top:100px;left:100px"><button id="t" style="${BTN}width:40px;height:40px;top:0;left:0">x</button></div>${near(115)}`,
    'fail',
    10
  ],
  [
    'the same, below the fold',
    `<div style="width:10px;height:10px;overflow:hidden;position:absolute;top:2000px;left:100px"><button id="t" style="${BTN}width:40px;height:40px;top:0;left:0">x</button></div>${near(115, 2000)}`,
    'fail',
    10
  ],
  [
    'an overflow: hidden box that is not its containing block does not clip it',
    `<div style="width:10px;height:10px;overflow:hidden;margin:100px 0 0 100px"><button id="t" style="${BTN}width:40px;height:40px;top:100px;left:100px">x</button></div>${near(142)}`,
    null,
    40
  ],
  [
    'a box painted over a 30×30 button takes nothing from it',
    `<div style="position:absolute;top:100px;left:100px"><button id="t" style="${BTN}width:30px;height:30px;top:0;left:0">x</button><div style="position:absolute;top:0;left:0;width:20px;height:30px;background:red"></div></div>${near(135)}`,
    null,
    30
  ],
  [
    'nor does another button over it: it is still 30×30',
    `<button id="t" style="${BTN}width:30px;height:30px;top:100px;left:100px">x</button><button id="o" style="${BTN}width:30px;height:20px;top:100px;left:100px">o</button>`,
    null,
    30
  ],
  [
    'a cell scrolled under a pinned column keeps its size',
    `<div style="position:absolute;top:100px;left:100px;width:200px;height:60px;overflow:auto"><div style="position:absolute;top:0;left:0;width:80px;height:400px;background:#fff;z-index:1"></div><div style="width:600px;height:60px;padding-left:40px"><button id="t" style="${BTN}width:30px;height:30px;top:10px;left:20px">x</button></div></div>`,
    null,
    30
  ],
  [
    "a 48×48 button under a neighbour's touch-target span keeps its size",
    `<button id="t" style="${BTN}width:48px;height:48px;top:100px;left:100px">x</button><button id="o" style="${BTN}width:60px;height:60px;top:94px;left:150px">o<span style="position:absolute;top:0;left:-46px;width:60px;height:60px"></span></button>`,
    null,
    48
  ],
  [
    'a box with pointer-events: none over it takes nothing',
    `<button id="t" style="${BTN}width:30px;height:30px;top:100px;left:100px">x</button><div style="position:absolute;top:100px;left:100px;width:20px;height:30px;pointer-events:none"></div>${near(132)}`,
    null,
    30
  ],
  [
    'a fixed bar over it covers it at one scroll position only, and takes nothing',
    `<button id="t" style="${BTN}width:30px;height:30px;top:100px;left:100px">x</button><div style="position:fixed;top:100px;left:0;width:100%;height:20px"></div>${near(132, 120)}`,
    null,
    30
  ],
  [
    'a 20×20 button rotated 45°',
    `<button id="t" style="${BTN}width:20px;height:20px;transform:rotate(45deg);top:100px;left:100px">x</button>${near(126)}`,
    'fail',
    14.1
  ],
  [
    'the same, with the rotate property',
    `<button id="t" style="${BTN}width:20px;height:20px;rotate:45deg;top:100px;left:100px">x</button>${near(126)}`,
    'fail',
    14.1
  ],
  [
    'the same, rotated by its parent',
    `<div style="position:absolute;top:100px;left:100px;width:20px;height:20px;transform:rotate(45deg)"><button id="t" style="${BTN}width:20px;height:20px;top:0;left:0">x</button></div>${near(126)}`,
    'fail',
    14.1
  ],
  [
    'a 40×40 button rotated 45° fits a 28.3 square',
    `<button id="t" style="${BTN}width:40px;height:40px;transform:rotate(45deg);top:100px;left:100px">x</button>${near(150)}`,
    null,
    28.3
  ],
  [
    'a 40×40 button scaled to 20×20',
    `<button id="t" style="${BTN}width:40px;height:40px;transform:scale(.5);top:100px;left:100px">x</button>${near(132)}`,
    'fail',
    20
  ],
  [
    'a 30×30 round button',
    `<button id="t" style="${BTN}width:30px;height:30px;border-radius:50%;top:100px;left:100px">x</button>${near(132, 110)}`,
    'fail',
    21.2
  ],
  [
    'a 24×24 button with 4px rounded corners',
    `<button id="t" style="${BTN}width:24px;height:24px;border-radius:4px;top:100px;left:100px">x</button>${near(126, 107)}`,
    'fail',
    21.7
  ],
  [
    'a 28×28 button with 4px rounded corners fits a 25.7 square',
    `<button id="t" style="${BTN}width:28px;height:28px;border-radius:4px;top:100px;left:100px">x</button>${near(130, 109)}`,
    null,
    25.7
  ],
  [
    'a 10×10 button with a 30×30 child sticking out of it',
    `<button id="t" style="${BTN}width:10px;height:10px;top:100px;left:100px"><span style="position:absolute;top:0;left:0;width:30px;height:30px;display:block"></span></button>${near(132)}`,
    null,
    30
  ],
  [
    'a link around a 30×30 box is the box, not the line it sits on',
    `<div style="position:absolute;top:100px;left:100px;font:16px/18px sans-serif"><a id="t" href="#"><span style="display:inline-block;width:30px;height:30px;vertical-align:top;background:#000"></span></a></div>${near(132)}`,
    null,
    30
  ],
  [
    'links parked before the start of the page, where no scrolling reaches, are no targets',
    `<a id="t" href="#main" style="position:absolute;left:-9999px;top:0">Skip to content</a><a id="n" href="#nav" style="position:absolute;left:-9999px;top:10px">Skip to navigation</a>`,
    null,
    null
  ],
  [
    'a link with display: contents around a 10×10 box',
    `<div style="position:absolute;top:100px;left:100px"><a id="t" href="#" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></a></div>${near(112)}`,
    'fail',
    10
  ],
  [
    'a button with display: contents around a 10×10 box',
    `<div style="position:absolute;top:100px;left:100px"><button id="t" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></button></div>${near(112)}`,
    'fail',
    10
  ]
];

test(
  'target-size-minimum measures the region a pointer can hit, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, outcome, size] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Targets</title></head><body style="margin:0"><main>${markup}</main></body></html>`
          );
          await page.evaluate(BUNDLE);
          const r = await page.evaluate(() => {
            const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
              'target-size-minimum'
            ]);
            const c = res.checksResults.find((x) => x.ruleId === 'target-size-minimum');
            const o = (c.occurrences || []).find((x) => x.selector === '#t');
            return {
              outcome: o ? o.occurrenceOutcome : null,
              square: o ? o.data.details.metrics.squarePx : null,
              margin: c.margin && c.margin.selector === '#t' ? c.margin.value : null
            };
          });
          assert.equal(r.outcome, outcome);
          if (outcome) assert.equal(r.square, size);
          else assert.equal(r.margin === null ? null : Math.round(r.margin * 10) / 10, size);
        } finally {
          await page.close();
        }
      });
    }

    await t.test('a size just under 24 does not read as 24', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Targets</title></head><body style="margin:0"><button id="t" style="${BTN}width:23.98px;height:30px;top:100px;left:100px">x</button>${near(126)}</body></html>`
        );
        await page.evaluate(BUNDLE);
        const summary = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'target-size-minimum'
          ]);
          const c = res.checksResults.find((x) => x.ruleId === 'target-size-minimum');
          return c.occurrences.find((x) => x.selector === '#t').summary;
        });
        assert.match(summary, /^Target is 23\.9×30 CSS px/);
      } finally {
        await page.close();
      }
    });
  }
);
