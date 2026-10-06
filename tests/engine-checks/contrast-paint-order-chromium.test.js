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
