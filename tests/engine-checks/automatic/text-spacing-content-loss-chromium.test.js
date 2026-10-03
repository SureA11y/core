'use strict';

/**
 * text-spacing-content-loss in a real browser: the spacing is applied, text
 * cut off by a clipping ancestor fails, text pushed out a little or made to
 * overlap is asked about, and the page is left as it was. Widths are sized
 * from the text's own measured width, so the cases hold whatever the fonts.
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

const RULE_ID = 'text-spacing-content-loss';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);
const TEXT = 'Opening hours today';

// `.fit` boxes are sized in the page to the width of their text (or of
// `data-text`) plus `data-extra` px.
function page(css, body) {
  return `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:20px;font:16px/20px sans-serif} .gap{margin-top:80px} ${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // `pageOptions` go to Playwright's newPage (viewport, colorScheme);
  // `setup` runs once the content is in, before the scan.
  async function scan(
    html,
    engineOptions = { rules: { include: RULE_ID } },
    pageOptions = {},
    setup
  ) {
    const p = await browser.newPage(pageOptions);
    try {
      await p.setContent(html);
      if (setup) await setup(p);
      await p.evaluate(() => {
        for (const el of document.querySelectorAll('.fit')) {
          const probe = document.createElement('span');
          probe.textContent = el.dataset.text || el.textContent;
          probe.style.whiteSpace = 'nowrap';
          el.parentNode.insertBefore(probe, el);
          el.style.width =
            probe.getBoundingClientRect().width + Number(el.dataset.extra || 2) + 'px';
          probe.remove();
        }
      });
      await p.addScriptTag({ content: BUNDLE });
      const before = await p.evaluate(() => [document.head.innerHTML, window.scrollY]);
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        engineOptions
      );
      const after = await p.evaluate(() => [document.head.innerHTML, window.scrollY]);
      assert.deepEqual(after, before, 'the spacing sheet is removed and the scroll put back');
      return result;
    } finally {
      await p.close();
    }
  }
  const findings = (result) =>
    (result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      o.occurrenceOutcome,
      o.data.details.reasonCode
    ]);
  const outcome = (result) => result.checksResults.find((r) => r.ruleId === RULE_ID).outcome;

  await t.test('the fixture', async () => {
    const result = await scan(FIXTURE);
    assert.deepEqual(findings(result), [
      ['tscl_case_01', 'fail', 'TEXT_CLIPPED'],
      ['tscl_case_02', 'cantTell', 'TEXT_OVERLAPS'],
      ['tscl_case_03', 'cantTell', 'STYLESHEET_IMPORTANT']
    ]);
    assert.equal(outcome(result), 'fail');
  });

  await t.test('a line pushed out of a clipping box fails, on either axis', async () => {
    for (const css of [
      // Wraps to a second line that sits wholly below the box.
      '#box{height:20px;overflow:hidden}',
      // Stays on one line that grows past the right edge.
      '#box{white-space:nowrap;overflow:hidden}',
      '#box{white-space:nowrap;overflow:clip}'
    ]) {
      const result = await scan(page(css, `<div class="fit" id="box">${TEXT}</div>`));
      assert.deepEqual(findings(result), [['box', 'fail', 'TEXT_CLIPPED']], css);
    }
  });

  await t.test('a line pushed out by less than half an em is asked about', async () => {
    const result = await scan(
      page(
        '#box{white-space:nowrap;overflow:hidden}',
        '<div class="fit" id="box" data-extra="1">Ab</div>'
      )
    );
    assert.deepEqual(findings(result), [['box', 'cantTell', 'TEXT_CLIPPED_PARTLY']]);
  });

  await t.test('text that comes to overlap other text is asked about', async () => {
    const result = await scan(
      page(
        '#box{height:20px}',
        `<div class="fit" id="box">${TEXT}</div><div>Closed on Sundays</div>`
      )
    );
    assert.deepEqual(findings(result), [['box', 'cantTell', 'TEXT_OVERLAPS']]);
  });

  await t.test('room to grow, a scrolling box, or text already hidden before: pass', async () => {
    for (const [css, body] of [
      ['', `<p>${TEXT}, and the rest of the week from nine to five.</p>`],
      ['#box{height:20px;overflow:auto}', `<div class="fit" id="box">${TEXT}</div>`],
      // A second slide already outside the box before the spacing.
      [
        '#box{width:120px;overflow:hidden;white-space:nowrap} #box span{display:inline-block;width:120px}',
        '<div id="box"><span>One</span><span>Two</span></div>'
      ]
    ]) {
      assert.equal(outcome(await scan(page(css, body))), 'pass', css);
    }
  });

  // Both seen on a news site's home page, where they were reported as cut off.
  await t.test('text hidden before, or reachable by scrolling, is not cut off', async () => {
    for (const [css, body] of [
      // Visually hidden text in a card that clips its content, sized so
      // the spaced-out text would reach past it.
      [
        '.card{position:relative;overflow:hidden;height:60px} .sr-only{position:absolute;top:0;left:0;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap}',
        `<div class="card fit" data-text="${TEXT}"><span class="sr-only">${TEXT}</span><p>Titre</p></div>`
      ],
      // A menu that scrolls sideways, inside a box sized to its text that
      // clips sideways: the spaced-out text can still be scrolled to.
      [
        '.wrap{overflow-x:hidden} .menu{overflow-x:auto;white-space:nowrap}',
        `<div class="wrap fit" data-text="${TEXT}"><div class="menu">${TEXT}</div></div>`
      ],
      // Text hidden by visibility or opacity does not overlap anything.
      [
        '.drop{position:absolute;top:20px;left:20px;visibility:hidden;width:200px} .op{opacity:0}',
        `<div class="drop">${TEXT} ${TEXT}</div><p class="op">${TEXT}</p><p>Texte visible ici</p>`
      ]
    ]) {
      assert.equal(outcome(await scan(page(css, body))), 'pass', css);
    }
  });

  const details = (result) =>
    result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences.map((o) => o.data.details);

  await t.test('a clipped line says how far it went, against what, and where', async () => {
    const viewport = { width: 800, height: 600 };
    const result = await scan(
      page('#box{white-space:nowrap;overflow:hidden}', `<div class="fit" id="box">${TEXT}</div>`),
      undefined,
      { viewport }
    );
    const [d] = details(result);
    assert.equal(d.reasonCode, 'TEXT_CLIPPED');
    assert.equal(d.text, TEXT);
    assert.equal(d.metrics.axis, 'x');
    // Half an em of the 16px text.
    assert.equal(d.metrics.thresholdPx, 8);
    assert.ok(d.metrics.overflowPx >= d.metrics.thresholdPx, JSON.stringify(d.metrics));
    assert.ok(d.container.widthPx > 0 && d.container.heightPx > 0, JSON.stringify(d.container));
    assert.deepEqual(d.viewport, viewport);

    const occ = result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences[0];
    const px = String(Math.round(d.metrics.overflowPx));
    assert.deepEqual(occ.i18n.params, { text: TEXT, overflowPx: px, viewportWidth: '800' });
    assert.match(
      occ.summary,
      new RegExp(`at a 800px-wide viewport, .* \\(${px}px past its edge\\)`)
    );
  });

  await t.test('a line pushed out a little reports the same measurements', async () => {
    const result = await scan(
      page(
        '#box{white-space:nowrap;overflow:hidden}',
        '<div class="fit" id="box" data-extra="1">Ab</div>'
      )
    );
    const [d] = details(result);
    assert.equal(d.reasonCode, 'TEXT_CLIPPED_PARTLY');
    assert.equal(d.metrics.axis, 'x');
    assert.ok(d.metrics.overflowPx > 2 && d.metrics.overflowPx < d.metrics.thresholdPx);
  });

  await t.test('an overlap says the viewport it happened at', async () => {
    const viewport = { width: 700, height: 500 };
    const result = await scan(
      page(
        '#box{height:20px}',
        `<div class="fit" id="box">${TEXT}</div><div>Closed on Sundays</div>`
      ),
      undefined,
      { viewport }
    );
    const [d] = details(result);
    assert.equal(d.reasonCode, 'TEXT_OVERLAPS');
    assert.deepEqual(d.viewport, viewport);
    assert.equal(d.metrics, undefined);
  });

  // The case that made this worth recording: the box only gets narrow below
  // a breakpoint, so the same page passes at one width and fails at another.
  await t.test('same page, two widths: two outcomes, each with its own viewport', async () => {
    const html = page(
      '#box{white-space:nowrap;overflow:hidden} @media (min-width:700px){#box{width:auto!important}}',
      `<div class="fit" id="box">${TEXT}</div>`
    );
    const wide = await scan(html, undefined, { viewport: { width: 1024, height: 600 } });
    const narrow = await scan(html, undefined, { viewport: { width: 500, height: 600 } });
    assert.equal(outcome(wide), 'pass');
    assert.equal(outcome(narrow), 'fail');
    assert.deepEqual(wide.engine.environment.viewport, { width: 1024, height: 600 });
    assert.deepEqual(narrow.engine.environment.viewport, { width: 500, height: 600 });
    assert.deepEqual(details(narrow)[0].viewport, { width: 500, height: 600 });
  });

  await t.test('the run records the conditions the page was rendered under', async () => {
    const html = page('', `<p>${TEXT}</p>`);
    const light = await scan(html, undefined, { viewport: { width: 640, height: 480 } });
    assert.deepEqual(light.engine.environment, {
      layout: true,
      viewport: { width: 640, height: 480 },
      devicePixelRatio: 1,
      colorScheme: 'light',
      fonts: 'loaded'
    });

    const dark = await scan(html, undefined, { colorScheme: 'dark', deviceScaleFactor: 2 });
    assert.equal(dark.engine.environment.colorScheme, 'dark');
    assert.equal(dark.engine.environment.devicePixelRatio, 2);

    // A web font whose file never arrives keeps the page's fonts loading.
    const loading = await scan(html, undefined, {}, async (p) => {
      await p.route('https://fonts.example.test/**', () => {});
      await p.evaluate(() => {
        const face = new FontFace('Slow', 'url(https://fonts.example.test/slow.woff2)');
        document.fonts.add(face);
        face.load().catch(() => {});
      });
    });
    assert.equal(loading.engine.environment.fonts, 'loading');

    // The conditions are the ones the scan started from. A rule that makes
    // the page load a font while it runs does not change them.
    const lateFont = {
      id: 'loads-a-font',
      meta: { title: 'loads a font', tags: [], wcagSc: [], type: 'automatic' },
      runInPage: `function runInPage(ctx) {
        const face = new FontFace('Late', 'url(https://fonts.example.test/late.woff2)');
        ctx.document.fonts.add(face);
        face.load().catch(() => {});
        return { outcome: 'pass', occurrences: [] };
      }`
    };
    const during = await scan(
      html,
      { rules: { include: [RULE_ID, 'loads-a-font'] }, customRules: [lateFont] },
      {},
      (p) => p.route('https://fonts.example.test/**', () => {})
    );
    assert.equal(during.engine.environment.fonts, 'loaded');
  });

  await t.test('the WCAG 1.4.12 rollup fails with it', async () => {
    const result = await scan(
      page('#box{height:20px;overflow:hidden}', `<div class="fit gap" id="box">${TEXT}</div>`),
      { profile: 'wcag22-aa' }
    );
    const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id).outcome;
    assert.equal(rollup('wcag-1.4.12-text-spacing'), 'fail');
  });
});
