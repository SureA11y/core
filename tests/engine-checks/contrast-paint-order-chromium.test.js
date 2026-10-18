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
  ],
  // Pseudo-elements whose paint isn't where their box is, or isn't known.
  [
    'a ::before clipped away by clip-path is not computable',
    `<style>.h::before{content:""; position:absolute; inset:0; z-index:-1; background:#000; clip-path:inset(0 100% 0 0)}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; padding:20px; width:300px"><span id="t">Text over the box</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a ::before over the text, clipped to nothing, is not computable',
    `<style>.h::before{content:""; position:absolute; inset:0; background:#fff; clip-path:circle(0)}</style><div class="h" style="position:relative; background:#000; color:#888; padding:20px; width:300px"><span id="t" style="position:relative">Text over the box</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a masked ::before is not computable',
    `<style>.h::before{content:""; position:absolute; inset:0; z-index:-1; background:#000; mask-image:linear-gradient(transparent, transparent); -webkit-mask-image:linear-gradient(transparent, transparent)}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; padding:20px; width:300px"><span id="t">Text over the box</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a ::before under text scrolled out of view, where the text scrolls to',
    `<style>.s::before{content:""; position:absolute; left:0; top:300px; width:100%; height:100px; z-index:-1; background:#000}</style><div style="height:100px; overflow:auto; background:#fff"><div class="s" style="position:relative; z-index:0; height:400px; color:#777"><div style="height:300px"></div><span id="t">Text out of view</span></div></div>`,
    '#000000',
    { pixels: true, scroll: true }
  ],
  [
    'a ::before moved off the text by its margin',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:100%; height:100%; margin-left:400px; z-index:-1; background:#000}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; padding:20px; width:300px"><span id="t">Text over the box</span></div>`,
    '#ffffff',
    { pixels: true }
  ],
  [
    'a ::before centered by auto margins, under the text',
    `<style>.h::before{content:""; position:absolute; inset:0; width:200px; height:40px; margin:auto; z-index:-1; background:#000}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; width:300px; height:80px; line-height:80px; text-align:center"><span id="t">Hi</span></div>`,
    '#000000',
    { pixels: true }
  ],
  [
    'text over the part of a ::before its background-clip leaves bare is not computable',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:340px; height:60px; box-sizing:border-box; padding-left:330px; z-index:-1; background:#000; background-clip:content-box}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; padding:20px; width:300px"><span id="t">Text over the box</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    "text inside a ::before's padding box, its background clipped there",
    `<style>.h::before{content:""; position:absolute; inset:0; border:10px solid transparent; z-index:-1; background:#000; background-clip:padding-box}</style><div class="h" style="position:relative; z-index:0; background:#fff; color:#777; padding:20px; width:300px"><span id="t">Text over the box</span></div>`,
    '#000000',
    { pixels: true }
  ],
  [
    'a ::before sized by its padding, under the text',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:0; height:0; padding:200px; background:#fff}</style><div class="h" style="position:relative; background:#000; color:#888; padding:20px; width:300px"><span id="t" style="position:relative">Text over the box</span></div>`,
    '#ffffff',
    { pixels: true }
  ],
  [
    'a ::before of a scaled element is not computable',
    `<style>.h::before{content:""; position:absolute; left:200px; top:0; width:200px; height:100%; z-index:-1; background:#fff}</style><div class="h" style="position:relative; z-index:0; background:#000; color:#888; padding:10px 0 10px 220px; width:180px; transform:scale(2); transform-origin:0 0"><span id="t">Hi</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  // A ::before that paints only a border is a frame, hollow inside.
  [
    'a ::before drawn as a border alone, under the text',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:0; height:0; border:200px solid #000; z-index:-1}</style><div class="h" style="position:relative; z-index:0; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    '#000000',
    { pixels: true }
  ],
  [
    'text in the hollow of a ::before frame',
    `<style>.h::before{content:""; position:absolute; inset:5px; border:4px solid #000; z-index:-1}</style><div class="h" style="position:relative; z-index:0; background:#000; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    '#000000',
    { pixels: true }
  ],
  [
    'text in the hollow of a ::before frame painted over it',
    `<style>.h::before{content:""; position:absolute; inset:5px; border:4px solid #000}</style><div class="h" style="position:relative; background:#000; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    '#000000',
    { pixels: true }
  ],
  [
    "text across a ::before frame's border is not computable",
    `<style>.h::before{content:""; position:absolute; inset:0; border:30px solid #000; z-index:-1}</style><div class="h" style="position:relative; z-index:0; line-height:40px; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a ::before border painted over the text is not computable',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:0; height:0; border:200px solid #000}</style><div class="h" style="position:relative; background:#fff; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'a ::before border in several colors under the text is not computable',
    `<style>.h::before{content:""; position:absolute; left:0; top:0; width:0; height:0; border:200px solid; border-color:#000 #fff #f00 #00f; z-index:-1}</style><div class="h" style="position:relative; z-index:0; color:#888; padding:20px; width:300px"><span id="t">Text in the frame</span></div>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'SVG text in a corner rounded by a percentage radius is not computable',
    `<svg width="300" height="200"><rect width="300" height="200" fill="#000"/><rect x="10" y="10" width="270" height="180" rx="50%" fill="none" stroke="#fff" stroke-width="20"/><text id="t" x="22" y="40" fill="#888" font-size="14">Growth</text></svg>`,
    'BACKGROUND_OVERLAP'
  ],
  [
    'SVG text in the middle of a frame with a percentage radius',
    `<svg width="300" height="200"><rect width="300" height="200" fill="#000"/><rect x="10" y="10" width="270" height="180" rx="10%" fill="none" stroke="#fff" stroke-width="20"/><text id="t" x="100" y="100" fill="#888" font-size="14">Growth</text></svg>`,
    '#000000',
    { pixels: true }
  ]
];

// The color painted under most of the text, with the text hidden.
async function paintedUnderText(browser, page) {
  await page.addStyleTag({
    content: '#t, #t * { color: transparent !important; fill: transparent !important }'
  });
  const rects = await page.evaluate(() => {
    const out = [];
    for (const n of document.getElementById('t').childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      for (const q of r.getClientRects()) out.push([q.left, q.top, q.width, q.height]);
    }
    return out;
  });
  const shot = await page.screenshot();
  const decoder = await browser.newPage();
  try {
    return await decoder.evaluate(
      async ([b64, boxes]) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        const counts = new Map();
        for (const [l, t, w, h] of boxes) {
          for (let y = Math.ceil(t + 1); y < t + h - 1; y++) {
            for (let x = Math.ceil(l + 1); x < l + w - 1; x++) {
              const i = (y * c.width + x) * 4;
              const k = '#' + [0, 1, 2].map((j) => d[i + j].toString(16).padStart(2, '0')).join('');
              counts.set(k, (counts.get(k) || 0) + 1);
            }
          }
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      },
      [shot.toString('base64'), rects]
    );
  } finally {
    await decoder.close();
  }
}

test('contrast against what is painted under the text, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, expected, check = {}] of CASES) {
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
          if (check.pixels) {
            if (check.scroll) {
              await page.evaluate(() => document.getElementById('t').scrollIntoView());
            }
            assert.equal(await paintedUnderText(browser, page), expected, 'pixels');
          }
        } else {
          assert.equal(r.reason, expected);
        }
      } finally {
        await page.close();
      }
    });
  }
});
