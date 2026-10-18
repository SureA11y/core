'use strict';

/**
 * Contrast is measured against what is painted under the text, in CSS's
 * painting order (#101): stacking contexts, z-index, positioned boxes and
 * document order decide whether another box lies under the text, over it,
 * or under an ancestor's background, and whether an ancestor's background
 * lies under the text at all. Solid colors covering all of the text are
 * measured against; anything else under or over it is not computable
 * (BACKGROUND_OVERLAP). A fixed or sticky box over the text is left out: it
 * covers it at the scan's scroll position only. This needs a layout, which
 * jsdom doesn't have, so these tests run in Chromium.
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

const T = (style = '') =>
  `<p id="t" style="color:#ddd; margin:0; padding:20px; position:relative; ${style}">Text over the box</p>`;

// [description, markup, expected background ('#rrggbb') or blocker reason]
const CASES = [
  [
    "a positioned box behind a card's text",
    `<div style="position:relative; background:#fff; padding:20px; width:300px"><div style="position:absolute; inset:10px; background:#000"></div>${T()}</div>`,
    '#000000'
  ],
  [
    'a fixed box behind the text',
    `<div style="position:fixed; top:0; left:0; width:400px; height:200px; background:#000"></div><div style="position:relative">${T()}</div>`,
    '#000000'
  ],
  [
    'a sticky box behind the text',
    `<div style="position:sticky; top:0; height:100px; background:#000"></div><div style="position:relative; margin-top:-90px">${T()}</div>`,
    '#000000'
  ],
  [
    'black at z-index 1 under white at z-index 2, under the text at 3',
    `<div style="position:relative; width:300px; height:80px"><div style="position:absolute; inset:0; background:#000; z-index:1"></div><div style="position:absolute; inset:0; background:#fff; z-index:2"></div>${T('z-index:3')}</div>`,
    '#ffffff'
  ],
  [
    'a later block pulled up under earlier text is painted under it',
    `<div><p id="t" style="color:#ddd; margin:0; height:40px; line-height:40px">Text over the box</p></div><div style="background:#000; height:60px; margin-top:-40px"></div>`,
    '#000000'
  ],
  [
    'a box over the text',
    `<div style="position:relative; width:300px; height:80px">${T('position:static')}<div style="position:absolute; inset:0; background:rgba(0,0,0,.3)"></div></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a sticky box over the text is left out',
    `<div style="position:relative">${T('position:static')}</div><div style="position:sticky; top:0; height:80px; margin-top:-80px; background:rgba(0,0,0,.3)"></div>`,
    '#ffffff'
  ],
  [
    'a box under one line of the text and not the other',
    `<div style="position:relative; width:120px"><div style="position:absolute; left:0; top:30px; width:120px; height:40px; background:#000"></div><p id="t" style="color:#ddd; margin:0; padding:0 0 0 0; position:relative; width:100px; line-height:20px; padding-top:20px">First line second line</p></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'text that overflows its own background is measured against what is under it',
    `<div style="background:#000; height:20px"><p id="t" style="color:#ddd; margin:0; padding-top:30px; line-height:20px">Text below the box</p></div>`,
    '#ffffff'
  ],
  [
    "text with a negative z-index is painted under its ancestor's background",
    `<div style="position:absolute; top:0; left:0; width:300px; height:80px; background:rgba(0,0,0,.5)"><p id="t" style="color:#ddd; margin:0; padding:20px; position:relative; z-index:-1">Text under the box</p></div>`,
    'BACKGROUND_OVERLAP'
  ],
  // A ::before or ::after with a negative z-index is painted over its
  // stacking context's background and under its text: the hover fill of a
  // cookie banner's button, a card's overlay.
  [
    "a ::before with a negative z-index, over its button's own background",
    `<style>#t::before{content:""; position:absolute; inset:0; z-index:-1; background:#2b2a2a}</style><button id="t" style="position:relative; z-index:1; background:#fc0; color:#fff; border:0; padding:10px 20px">Accept all</button>`,
    '#2b2a2a'
  ],
  [
    'a translucent ::before with a negative z-index is composited over the background',
    `<style>#t::before{content:""; position:absolute; inset:0; z-index:-1; background:rgba(0,0,0,.5)}</style><p id="t" style="position:relative; z-index:0; background:#fff; color:#000; margin:0; padding:20px">Text over the box</p>`,
    '#808080'
  ],
  [
    'a ::before with a negative z-index painting an image is not computable',
    `<style>#t::before{content:""; position:absolute; inset:0; z-index:-1; background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>"); transform:scale(4)}</style><button id="t" style="position:relative; z-index:1; background:#fc0; color:#fff; border:0; padding:10px 20px">Accept all</button>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    "a ::before with a negative z-index outside its element's stacking context is under the element's background",
    `<style>#t::before{content:""; position:absolute; inset:0; z-index:-1; background:#2b2a2a}</style><p id="t" style="position:relative; background:#fc0; color:#fff; margin:0; padding:20px">Text over the box</p>`,
    '#ffcc00'
  ],
  [
    'a ::before of an ancestor, with a negative z-index',
    `<style>.c::before{content:""; position:absolute; inset:0; z-index:-1; background:#000}</style><div class="c" style="position:relative; z-index:0; background:#fff; padding:20px">${T('position:static; padding:0')}</div>`,
    '#000000'
  ],
  [
    "a child with a negative z-index, under its parent's own text",
    `<div id="t" style="position:relative; z-index:1; background:#fc0; color:#fff; padding:20px">Accept all<span style="position:absolute; inset:0; z-index:-1; background:#2b2a2a"></span></div>`,
    '#2b2a2a'
  ],
  // Any ::before or ::after positioned against its element is ordered with
  // the text: under it, a solid one is measured against.
  [
    'a ::before of a positioned ancestor, under text with a z-index of its own',
    `<style>.s::before{content:""; position:absolute; inset:0; background:rgb(235,233,222)}</style><div class="s" style="position:relative; z-index:3; padding:10px"><a id="t" href="#" style="position:relative; z-index:1; color:#333; display:inline-block">Professionals</a></div>`,
    '#ebe9de'
  ],
  [
    'a ::before under the text of a positioned child',
    `<style>.s::before{content:""; position:absolute; inset:0; background:#000}</style><div class="s" style="position:relative; width:300px">${T()}</div>`,
    '#000000'
  ],
  [
    'a ::after painted over the text is not computable',
    `<style>.s::after{content:""; position:absolute; inset:0; background:rgba(0,0,0,.4)}</style><div class="s" style="position:relative; width:300px">${T('position:static')}</div>`,
    'BACKGROUND_OVERLAP'
  ],
  // An SVG shape drawn with a stroke alone paints only its outline.
  [
    "SVG text inside a chart's frame, a rect with a stroke and no fill",
    `<svg width="300" height="200"><rect x="1" y="1" width="278" height="180" fill="none" stroke="#e0e0e0" stroke-width="0.7"/><text id="t" x="12" y="26" fill="#333">Economic growth</text></svg>`,
    '#ffffff'
  ],
  [
    "SVG text across the frame's stroke is not computable",
    `<svg width="300" height="200"><rect x="1" y="1" width="278" height="180" fill="none" stroke="#000" stroke-width="4"/><text id="t" x="200" y="8" fill="#333">Economic growth</text></svg>`,
    'BACKGROUND_OVERLAP'
  ],
  // A filter that is only drop-shadow() is hidden under opaque content.
  [
    'a header with a drop shadow and an opaque background',
    `<header style="filter:drop-shadow(0 1px 3px rgba(0,0,18,.16)); background:#000">${T('position:static')}</header>`,
    '#000000'
  ],
  [
    'a positioned box behind the text, in a header with a drop shadow',
    `<header style="filter:drop-shadow(0 1px 3px rgba(0,0,18,.16)); background:#fff; position:relative; padding:10px"><div style="position:absolute; inset:0; background:#000"></div>${T()}</header>`,
    '#000000'
  ],
  [
    'text overflowing an opaque header into its drop shadow is not computable',
    `<div style="padding-bottom:80px"><header style="background:#fff; height:20px; filter:drop-shadow(0 30px 0 #000)"><p style="margin:0">Top</p><p id="t" style="margin:12px 0 0; color:#000; line-height:20px">Overflowing text</p></header></div>`,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  ],
  [
    'a positioned child below an opaque header with a drop shadow is not computable',
    `<div style="padding-bottom:80px"><header style="position:relative; background:#fff; height:20px; filter:drop-shadow(0 30px 0 #000)"><p id="t" style="position:absolute; top:32px; margin:0; color:#000; line-height:20px">Popup text</p></header></div>`,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  ],
  [
    'text in the rounded corner of a header with a drop shadow is not computable',
    `<header style="background:#fff; border-radius:20px; filter:drop-shadow(0 0 0 #000)"><p id="t" style="margin:0; color:#000">Rounded header text</p></header>`,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  ],
  [
    'a drop shadow with nothing opaque under the text is not computable',
    `<div style="filter:drop-shadow(0 1px 3px #000)">${T('position:static')}</div>`,
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER'
  ],
  [
    'a gradient under the text is not computable',
    `<div style="position:relative; width:300px; height:80px"><div style="position:absolute; inset:0; background:radial-gradient(circle, #eef2ff, #ffffff)"></div>${T()}</div>`,
    'BACKGROUND_OVERLAP'
  ]
];

test('contrast against what is painted under the text, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, expected] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Paint order</title></head><body style="background:#fff; margin:0"><main>${markup}</main></body></html>`
        );
        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const el = document.getElementById('t');
          const probe = {
            id: 'zz-probe',
            meta: {
              id: 'zz-probe',
              title: 'probe',
              description: 'probe',
              type: 'automatic',
              severity: 'minor',
              tags: [],
              wcagSc: [],
              defaultSeverity: 'minor'
            },
            runInPage(ctx) {
              const c = ctx.helpers.contrast;
              const blocker = c.getComputabilityBlocker(el);
              const bg = c.computeEffectiveBackground(el, {});
              return {
                ruleId: 'zz-probe',
                outcome: 'pass',
                occurrences: [],
                data: {
                  reason: blocker.ok ? null : blocker.reasonCode,
                  bg: bg && bg.ok ? bg.rgba : null
                }
              };
            }
          };
          const res = window.a11ycore.runa11yCoreInPage(
            location.href,
            null,
            { customRules: [probe] },
            ['zz-probe']
          );
          return res.checksResults[0].data;
        });
        if (expected.startsWith('#')) {
          assert.equal(r.reason, null, `not computable: ${r.reason}`);
          const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
          assert.equal(`#${hex(r.bg.r)}${hex(r.bg.g)}${hex(r.bg.b)}`, expected);
        } else {
          assert.equal(r.reason, expected);
        }
      } finally {
        await page.close();
      }
    });
  }
});
