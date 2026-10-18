'use strict';

/**
 * A background-image layer that is a solid color, or paints nothing under
 * the text, doesn't stop contrast being measured: a gradient whose every
 * stop is one color is that color, a layer sized to nothing or 2px thick or
 * less (an underline, as the DSFR draws them) is ignored, and a solid layer
 * covering part of the element counts where it meets the text's line boxes.
 * Anything else is an image or a gradient, and the text is asked about
 * (BACKGROUND_IMAGE_OR_GRADIENT). Where a layer lies takes a layout, which
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

const P = (style, text = 'Some text here') =>
  `<p id="t" style="margin:0; padding:10px; font-size:16px; line-height:20px; ${style}">${text}</p>`;
const LONG = 'Line one of text that wraps onto line two '.repeat(6);

// [description, markup, expected background ('#rrggbb') or blocker reason]
const CASES = [
  [
    'a solid gradient over the whole background is its color',
    P('color:#fff; background:linear-gradient(#000, #000)'),
    '#000000'
  ],
  [
    'a translucent solid gradient is composited over the background color',
    P('color:#000; background:#fff linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5))'),
    '#808080'
  ],
  [
    'a repeating gradient with one color',
    P('color:#fff; background:repeating-linear-gradient(#000 0 10px, #000 10px 20px)'),
    '#000000'
  ],
  [
    "the DSFR's link underline: two solid layers, 2px and 1px thick",
    `<p style="margin:0"><a id="t" href="#" style="color:#000091; background-image:linear-gradient(0deg,#000091,#000091),linear-gradient(0deg,#000091,#000091); background-size:0 2px,100% 1px; background-position:0 100%,0 calc(100% - 1px); background-repeat:no-repeat">See all</a></p>`,
    '#ffffff'
  ],
  [
    'an underline over a transparent layer',
    `<p style="margin:0"><a id="t" href="#" style="color:#111; background-image:linear-gradient(to top,#111 0,#111 0),linear-gradient(to top,transparent 0,transparent 0); background-size:100% 1px,100% 1px; background-position:0 100%,0 calc(100% - 1px); background-repeat:no-repeat">News</a></p>`,
    '#ffffff'
  ],
  [
    'an underline sized to no width, on a colored block',
    `<div style="background:#3879bf; padding:10px"><h3 style="margin:0"><a id="t" href="#" style="color:#fff; background:linear-gradient(#444,#444) 0 100%/0 3px no-repeat">News</a></h3></div>`,
    '#3879bf'
  ],
  [
    'a solid band clear of the text',
    P(
      'color:#000; background:#fff linear-gradient(#000,#000) 0 100%/100% 8px no-repeat; padding:0 0 10px 0'
    ),
    '#ffffff'
  ],
  [
    'a solid band under all of the text',
    P('color:#fff; background:#fff linear-gradient(#000,#000) 0 0/100% 24px no-repeat; padding:0'),
    '#000000'
  ],
  [
    'an opaque solid layer hides the gradient under it',
    P(
      'color:#000; border:3px solid transparent; background:linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg,red,blue) border-box'
    ),
    '#ffffff'
  ],
  [
    'a gradient of two colors is not computable',
    P('color:#000; background:linear-gradient(#fff, #eee)'),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a solid band under part of the text is not computable',
    P(
      'color:#fff; background:#fff linear-gradient(#000,#000) 0 0/100% 50% no-repeat; padding:0',
      LONG
    ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a solid gradient clipped to the text is not computable',
    P(
      'color:transparent; background:linear-gradient(#000,#000); -webkit-background-clip:text; background-clip:text'
    ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a solid gradient blended with the background color is not computable',
    P('color:#fff; background:#888 linear-gradient(#000,#000); background-blend-mode:multiply'),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a gradient stop in a color the engine does not read',
    P('color:#fff; background:linear-gradient(#000, color(display-p3-linear .9 .9 .9), #000)'),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a solid gradient with an angle, a hint and an interpolation space',
    P('color:#fff; background:linear-gradient(45deg in oklch, #000 0%, 50%, #000 100%)'),
    '#000000'
  ],
  [
    'a fixed band over the text',
    `<div style="height:100px"></div>` +
      P(
        'color:#000; padding:0; background:#fff linear-gradient(#000,#000) 0 100px/100% 40px no-repeat fixed'
      ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a fixed band elsewhere in the viewport',
    `<div style="height:200px"></div>` +
      P(
        'color:#fff; padding:0; background:#000 linear-gradient(#fff,#fff) 0 0/100% 40px no-repeat fixed'
      ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a fixed solid layer that tiles both ways',
    P('color:#fff; background:#fff linear-gradient(#000,#000) fixed'),
    '#000000'
  ],
  [
    'a 2px tile repeated with space',
    P(
      'color:#000; padding:4px 0 0; height:20px; background:#fff linear-gradient(#000,#000) 0 0/100% 2px; background-repeat:no-repeat space'
    ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a band placed under scale(2)',
    `<div style="height:60px"></div><div style="transform:scale(2); transform-origin:0 0; width:300px"><p id="t" style="margin:0; color:#000; height:100px; padding-top:82px; box-sizing:border-box; line-height:6px; font-size:6px; background:#fff linear-gradient(#000,#000) 0 100%/100% 20px no-repeat">Some text here</p></div>`,
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a band placed under rotate(180deg)',
    `<div style="transform:rotate(180deg); width:300px"><p id="t" style="margin:0; color:#000; height:60px; padding-top:40px; box-sizing:border-box; line-height:20px; background:#fff linear-gradient(#000,#000) 0 0/100% 20px no-repeat">Some text here</p></div>`,
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ],
  [
    'a band clear of the text under a translation',
    `<div style="transform:translate(10px,10px); width:300px"><p id="t" style="margin:0; color:#000; height:60px; padding-top:40px; box-sizing:border-box; line-height:20px; background:#fff linear-gradient(#000,#000) 0 0/100% 20px no-repeat">Some text here</p></div>`,
    '#ffffff'
  ],
  [
    'twelve stacked 2px layers over the text',
    P(
      'color:#000; padding:0; height:24px; background:' +
        Array.from(
          { length: 12 },
          (_, i) => `linear-gradient(#000,#000) 0 ${i * 2}px/100% 2px no-repeat`
        ).join(', ') +
        ', #fff'
    ),
    'BACKGROUND_IMAGE_OR_GRADIENT'
  ]
];

test(
  'contrast over background layers that are a solid color or paint nothing, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, expected] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Background layers</title></head><body style="background:#fff; margin:0"><main>${markup}</main></body></html>`
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
  }
);
