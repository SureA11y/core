'use strict';

/**
 * Text that a box clipping its overflow keeps out of view, such as the
 * options of an autocomplete list scrolled past its height, in a real
 * browser. Such text is seen once scrolled into the box, where it moves
 * with the box's content, so it is measured against the box and its
 * ancestors and against paint inside the box, never against what lies
 * where it is now, outside the box. It was measured against that (#176), so
 * options further down a white list in a dialog over a dark page failed.
 * This needs a layout, which jsdom doesn't have, so these tests run in
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

const ITEMS = (n, style = '') =>
  Array.from(
    { length: n },
    (_, i) =>
      `<div style="height:48px; line-height:48px; padding:0 16px; ${style}">Option ${i + 1}</div>`
  ).join('');
const T = (style = '') =>
  `<div id="t" style="height:48px; line-height:48px; padding:0 16px; ${style}">Further down</div>`;
const LIST = (style, content) =>
  `<div style="position:relative; width:300px; max-height:150px; overflow:auto; ${style}">${content}</div>`;

// [description, page background, markup, expected background ('#rrggbb') or blocker reason]
const CASES = [
  [
    'an option scrolled out of a white list, over a dark page',
    '#263238',
    LIST('background:#fff; color:#555', ITEMS(5) + T()),
    '#ffffff'
  ],
  [
    'an option scrolled out of a dark list, over a white page',
    '#fff',
    LIST('background:#212121; color:#eee', ITEMS(5) + T()),
    '#212121'
  ],
  [
    "an option cut by the list's bottom edge",
    '#263238',
    LIST('background:#fff; color:#555', ITEMS(2) + T()),
    '#ffffff'
  ],
  [
    'a slide out of view in a track that hides its overflow',
    '#fff',
    `<div style="background:#123; color:#fff; overflow:hidden; width:300px; white-space:nowrap"><div style="display:inline-block; width:300px">One</div><div style="display:inline-block; width:300px">Two</div><div id="t" style="display:inline-block; width:300px">Three</div></div>`,
    '#112233'
  ],
  [
    'out of view, over a dark box inside the list',
    '#fff',
    LIST(
      'background:#fff; color:#eee',
      ITEMS(5) +
        '<div style="position:absolute; top:240px; left:0; width:300px; height:48px; background:#000"></div>' +
        T('position:relative')
    ),
    '#000000'
  ],
  [
    'out of view, under a box inside the list',
    '#fff',
    LIST(
      'background:#fff; color:#555',
      ITEMS(5) +
        T() +
        '<div style="position:absolute; top:240px; left:0; width:300px; height:48px; background:rgba(0,0,0,.3)"></div>'
    ),
    'BACKGROUND_OVERLAP'
  ],
  [
    'out of view in a list scrolled to its end',
    '#263238',
    LIST('background:#fff; color:#555', T() + ITEMS(5)) +
      '<script>document.querySelector("main > div").scrollTop = 9999</script>',
    '#ffffff'
  ]
];

// An autocomplete panel opened in a modal dialog of limited height, in the
// overlay container both are rendered in, over a dark page: the list of
// options is longer than the panel and scrolls.
const DIALOG = (optionColor, script = '') =>
  `<style>
.page{background:#263238;color:#fff;height:1200px;padding:16px}
.overlay{position:fixed;z-index:1000;inset:0;pointer-events:none}
.backdrop{position:absolute;inset:0;background:rgba(0,0,0,.32);pointer-events:auto}
.wrapper{position:absolute;inset:0;display:flex;justify-content:center;align-items:center}
.surface{width:400px;max-height:300px;overflow:hidden;background:#fff;color:rgba(0,0,0,.87);pointer-events:auto}
.content{max-height:200px;overflow:auto;padding:20px 24px}
.box{position:absolute;top:150px;left:calc(50% - 176px);width:352px;pointer-events:auto}
.panel{max-height:256px;overflow:auto;padding:8px 0;background:#fff}
.option{min-height:48px;display:flex;align-items:center;padding:0 16px;color:${optionColor}}
</style>
<div class="page"><p>Page content</p></div>
<div class="overlay">
  <div class="backdrop"></div>
  <div class="wrapper"><div class="surface" role="dialog" aria-modal="true" aria-label="Pick a state"><div class="content"><label>State <input></label><p>Text in the dialog.</p></div></div></div>
  <div class="box"><div class="panel" role="listbox" aria-label="States">${Array.from(
    { length: 15 },
    (_, i) =>
      `<div class="option" role="option" aria-selected="false"><span>State ${i + 1}</span></div>`
  ).join('')}</div></div>
</div>${script}`;

test('contrast of text scrolled out of view, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function load(body, markup) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Scrolled</title></head><body style="background:${body}; margin:0"><main>${markup}</main></body></html>`
    );
    await page.evaluate(BUNDLE);
    return page;
  }

  for (const [description, body, markup, expected] of CASES) {
    await t.test(description, async () => {
      const page = await load(body, markup);
      try {
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

  async function contrast(markup) {
    const page = await load('#fff', markup);
    try {
      return await page.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
          'contrast-minimum',
          'contrast-computable'
        ]);
        const get = (id) => r.checksResults.find((c) => c.ruleId === id);
        return {
          minimum: get('contrast-minimum').outcome,
          computable: get('contrast-computable').outcome,
          failed: get('contrast-minimum').occurrences.filter(
            (o) => o.data && o.data.details && o.data.details.reasonCode === 'BELOW_THRESHOLD'
          ).length
        };
      });
    } finally {
      await page.close();
    }
  }

  await t.test('the options of an autocomplete in a dialog pass, scrolled or not', async () => {
    for (const script of [
      '',
      '<script>document.querySelector(".panel").scrollTop = 9999</script>'
    ]) {
      const r = await contrast(DIALOG('rgba(0,0,0,.87)', script));
      assert.equal(r.minimum, 'pass');
      assert.equal(r.computable, 'pass');
    }
  });

  await t.test('options too light for the panel fail, in view or not', async () => {
    const r = await contrast(DIALOG('#aaa'));
    assert.equal(r.minimum, 'fail');
    assert.equal(r.failed, 15);
  });
});
