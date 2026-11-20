'use strict';

/**
 * reflow-horizontal-scroll in a real browser, at a viewport 320 CSS pixels
 * wide: what sticks out past the edge makes the page scroll sideways and
 * fails; tables, media and preformatted text are asked about; a page that
 * clips its sides asks about what the edge cuts through; boxes that scroll on
 * their own are left alone; and at a wider viewport, in a frame, or in
 * vertical text, the rule is notApplicable.
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

const RULE_ID = 'reflow-horizontal-scroll';
const { addBundle } = require('../../helpers/browserBundle');
const { howToCheckFor } = require('../../../src/how-to-check');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);
const PHONE = { viewport: { width: 320, height: 640 } };

function page(css, body, attrs = 'lang="en"') {
  return `<!doctype html><html ${attrs}><head><title>t</title><style>body{margin:8px;font:16px/1.4 sans-serif} ${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, { pageOptions = PHONE, engineOptions = {}, scope = null } = {}) {
    const p = await browser.newPage(pageOptions);
    try {
      await p.setContent(html);
      await addBundle(p);
      const opts = { rules: { include: RULE_ID }, ...engineOptions };
      const result = await p.evaluate(
        ([o, s]) => window.a11ycore.runa11yCoreInPage(null, s, o, null),
        [opts, scope]
      );
      return result.checksResults.find((r) => r.ruleId === RULE_ID);
    } finally {
      await p.close();
    }
  }
  const findings = (check) =>
    (check.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || o.data.details.element,
      o.occurrenceOutcome,
      o.data.details.reasonCode,
      o.lean ? o.lean.toward : null
    ]);

  await t.test('the fixture, at 320 pixels wide: each case as its title says', async () => {
    const check = await scan(FIXTURE);
    assert.equal(check.outcome, 'fail');
    assert.deepEqual(findings(check), [
      ['reflow_case_04', 'fail', 'HORIZONTAL_SCROLL', null],
      ['reflow_case_05', 'fail', 'HORIZONTAL_SCROLL', null],
      ['reflow_case_06', 'cantTell', 'WIDE_TABLE', 'pass'],
      ['reflow_case_07', 'cantTell', 'WIDE_MEDIA', 'fail'],
      ['reflow_case_08', 'cantTell', 'WIDE_PREFORMATTED', null]
    ]);
    const occ = check.occurrences[0];
    assert.equal(occ.data.details.edge, 'right');
    assert.ok(occ.data.details.overflowPx > 200, 'how far past the edge');
    assert.equal(occ.data.details.viewport.width <= 320, true);
    assert.equal(occ.i18n.summaryKey, 'reflowHorizontalScroll_summary_fail');
    // Each undecided finding's code has steps, in every locale.
    for (const code of [
      'WIDE_TABLE',
      'WIDE_MEDIA',
      'WIDE_PREFORMATTED',
      'CLIPPED_BY_CONTAINER',
      'SCROLLS_IN_CONTAINER',
      'CLIPPED_AT_VIEWPORT_EDGE'
    ]) {
      for (const locale of ['en', 'es', 'de', 'fr', 'ja']) {
        const how = howToCheckFor(RULE_ID, code, locale);
        assert.ok(
          how && how.steps.length === 3 && how.passWhen && how.failWhen,
          `${code} ${locale}`
        );
      }
    }
  });

  await t.test(
    'a page that fits passes; at a wider viewport the rule is notApplicable',
    async () => {
      const fits = await scan(page('', '<p>Opening hours today, and the rest of the week.</p>'));
      assert.equal(fits.outcome, 'pass');
      const wide = await scan(page('', '<div style="width:900px">Wide</div>'), {
        pageOptions: { viewport: { width: 1024, height: 768 } }
      });
      assert.equal(wide.outcome, 'notApplicable');
      assert.deepEqual(wide.data, { reason: 'viewportWider' });
    }
  );

  await t.test('a layout table leans fail, a data table leans pass', async () => {
    const check = await scan(
      page(
        'table{width:600px}',
        '<table id="layout" role="presentation"><tr><td>a</td><td>b</td></tr></table>'
      )
    );
    assert.deepEqual(findings(check), [['layout', 'cantTell', 'WIDE_TABLE', 'fail']]);
  });

  await t.test('a scrolling box may hold a table, code or media at full width', async () => {
    const check = await scan(
      page(
        'table{width:600px} img{display:block}',
        '<div style="overflow-x:auto"><table id="a"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></div>' +
          '<pre style="overflow-x:auto" id="b"><code>const openingHours = { monday: "9:00", tuesday: "9:00" };</code></pre>' +
          '<div style="overflow-x:auto"><img id="c" width="600" height="20" alt=""></div>'
      )
    );
    assert.equal(check.outcome, 'pass');
  });

  await t.test('a form wider than its scrolling dialog fails', async () => {
    // A dialog whose content scrolls (overflow auto), holding a panel with a
    // forced minimum width, as a filter dialog does.
    const check = await scan(
      page(
        '.dialog{overflow:auto;border:1px solid;position:fixed;inset:0;max-width:100%} .panel{min-width:584px} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}',
        '<div class="dialog"><form><div class="panel" id="panel"><div class="grid"><label>Type <select><option>All</option></select></label><label>Direction <select><option>All</option></select></label></div></div></form></div>'
      )
    );
    // No exception covers a form, so it is settled as a failure, not asked about.
    assert.equal(check.outcome, 'fail');
    assert.deepEqual(findings(check), [['panel', 'fail', 'SCROLLS_IN_CONTAINER', null]]);
    assert.equal(check.occurrences[0].i18n.summaryKey, 'reflowHorizontalScroll_summary_scrollBox');
    // The same page with the panel fitting its dialog passes.
    const fits = await scan(
      page(
        '.dialog{overflow:auto;position:fixed;inset:0} .panel{min-width:0}',
        '<div class="dialog"><form><div class="panel"><label>Type <select><option>All</option></select></label></div></form></div>'
      )
    );
    assert.equal(fits.outcome, 'pass');
  });

  await t.test('fields cut off by a box that hides overflow fail', async () => {
    const check = await scan(
      page(
        '.card{overflow:hidden;border:1px solid} .grid{display:flex;width:560px} .grid>div{flex:none;width:270px}',
        '<div class="card"><div class="grid" id="g"><div><label>Type <input></label></div><div><label>Direction <input></label></div></div></div>'
      )
    );
    assert.equal(check.outcome, 'fail');
    assert.deepEqual(findings(check), [['g', 'fail', 'CLIPPED_BY_CONTAINER', null]]);
  });

  await t.test(
    'a carousel of links and a data table with a field are still asked about',
    async () => {
      const check = await scan(
        page(
          'table{width:600px} .card{overflow:hidden;border:1px solid} .row{display:flex;width:560px} .row>a{flex:none;width:270px}',
          '<div class="card"><div class="row" id="rail"><a href="#a">One</a><a href="#b">Two</a></div></div>' +
            '<div class="card"><table id="t"><tr><th>A</th><th>B</th></tr><tr><td><input aria-label="x"></td><td>2</td></tr></table></div>'
        )
      );
      assert.deepEqual(findings(check), [
        ['rail', 'cantTell', 'CLIPPED_BY_CONTAINER', 'fail'],
        ['t', 'cantTell', 'CLIPPED_BY_CONTAINER', 'fail']
      ]);
    }
  );

  await t.test('a box that hides what overflows it asks about what it cuts off', async () => {
    // A card (overflow hidden) around a data table, and a filter panel whose
    // second column is cut. Not reported: a hidden box whose content fits,
    // visually hidden text, a truncated label, and what waits wholly outside.
    const check = await scan(
      page(
        'table{width:600px} .card{overflow:hidden;border:1px solid} .grid{display:flex;width:560px}' +
          ' .grid>div{flex:none;width:270px} .sr{position:absolute;width:1px;height:1px;overflow:hidden}' +
          ' .ell{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
        '<div class="card"><table id="t"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></div>' +
          '<div class="card" id="panel"><div class="grid" id="g"><div>One</div><div>Two</div></div></div>' +
          '<div class="card"><p id="fits">Fits in its box</p></div>' +
          '<span class="sr">Visually hidden text that is read aloud and is much longer than one pixel</span>' +
          '<p class="ell" style="width:100px">Truncated label with an ellipsis that is long</p>' +
          '<div style="overflow:hidden;width:100px"><nav style="margin-left:150px">Off-canvas</nav></div>'
      )
    );
    assert.deepEqual(findings(check), [
      ['t', 'cantTell', 'CLIPPED_BY_CONTAINER', 'fail'],
      ['g', 'cantTell', 'CLIPPED_BY_CONTAINER', 'fail']
    ]);
  });

  await t.test('text cut by its own hidden box is asked about', async () => {
    const check = await scan(
      page(
        '',
        '<p style="overflow-x:hidden" id="c">https://example.org/a/very/long/address/that/cannot/wrap/at/all</p>'
      )
    );
    assert.deepEqual(findings(check), [['c', 'cantTell', 'CLIPPED_BY_CONTAINER', 'fail']]);
  });

  await t.test('a wide table and a wide tab group on a scrolling page are both named', async () => {
    const check = await scan(
      page(
        'table{width:600px} .tabs{display:flex;white-space:nowrap;width:560px}',
        '<div class="tabs" id="tabs"><button>All</button><button>Executed</button><button>Rejected</button><button>Failed</button><button>Pending</button></div>' +
          '<table id="t"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'
      )
    );
    assert.deepEqual(findings(check), [
      ['tabs', 'fail', 'HORIZONTAL_SCROLL', null],
      ['t', 'cantTell', 'WIDE_TABLE', 'pass']
    ]);
  });

  await t.test('a page kept from scrolling asks about what the edge cuts through', async () => {
    const check = await scan(
      page(
        'html{overflow-x:hidden} .wide{width:600px} .off{position:absolute;left:400px;width:200px}',
        '<div class="wide" id="cut">Cut by the edge</div><nav class="off" id="off">Off-canvas menu</nav>'
      )
    );
    assert.deepEqual(findings(check), [['cut', 'cantTell', 'CLIPPED_AT_VIEWPORT_EDGE', 'fail']]);
  });

  await t.test('scrolling with no element to name fails on the document', async () => {
    const check = await scan(
      page('body::after{content:"";display:block;width:700px;height:1px}', '<p>x</p>')
    );
    assert.equal(check.outcome, 'fail');
    assert.deepEqual(
      check.occurrences.map((o) => [o.data.details.reasonCode, o.data.details.element]),
      [['HORIZONTAL_SCROLL_UNATTRIBUTED', 'html']]
    );
  });

  await t.test('in right-to-left text, the left edge is the one measured', async () => {
    const check = await scan(
      page('.wide{width:600px}', '<div class="wide" id="rtl">واسع</div>', 'lang="ar" dir="rtl"')
    );
    assert.deepEqual(findings(check), [['rtl', 'fail', 'HORIZONTAL_SCROLL', null]]);
    assert.equal(check.occurrences[0].data.details.edge, 'left');
  });

  await t.test(
    'vertical text and a framed document are notApplicable, unless the host names the page',
    async () => {
      const vertical = await scan(
        page('html{writing-mode:vertical-rl}', '<p>縦書き</p>', 'lang="ja"')
      );
      assert.deepEqual(vertical.data, { reason: 'verticalWritingMode' });

      const p = await browser.newPage(PHONE);
      try {
        await p.setContent(
          '<iframe style="width:300px;height:200px;border:0" srcdoc="<!doctype html><html lang=en><body><div style=\'width:600px\'>Wide</div></body></html>"></iframe>'
        );
        const frame = p.frames()[1];
        await frame.waitForLoadState();
        await addBundle(frame);
        const run = (topLevelDocument) =>
          frame.evaluate(
            (o) =>
              window.a11ycore
                .runa11yCoreInPage(null, null, o, null)
                .checksResults.find((r) => r.ruleId === 'reflow-horizontal-scroll'),
            { rules: { include: RULE_ID }, ...(topLevelDocument ? { topLevelDocument: true } : {}) }
          );
        assert.equal((await run(false)).outcome, 'notApplicable', 'a frame is not the page');
        assert.equal((await run(true)).outcome, 'fail', 'unless the host says it is');
      } finally {
        await p.close();
      }
    }
  );

  await t.test('a scoped scan judges only its scope, and gives no pass', async () => {
    const html = page(
      '.wide{width:600px}',
      '<main id="m"><p>Fits</p></main><aside><div class="wide" id="w">Wide</div></aside>'
    );
    const scoped = await scan(html, { scope: '#m' });
    assert.equal(scoped.outcome, 'notApplicable');
    const other = await scan(html, { scope: 'aside' });
    assert.deepEqual(findings(other), [['w', 'fail', 'HORIZONTAL_SCROLL', null]]);
  });

  await t.test('a phone that zooms out to show a wide page still runs the rule', async () => {
    // A phone browser zooms out to show a page wider than its layout
    // viewport, which widens innerWidth exactly when the page overflows.
    const meta = (body) =>
      '<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>' +
      body +
      '</body></html>';
    const phone = { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true };
    const wide = await scan(meta('<div id="w" style="width:600px">Wide</div>'), {
      pageOptions: phone
    });
    assert.deepEqual(findings(wide), [['w', 'fail', 'HORIZONTAL_SCROLL', null]]);
    const fits = await scan(meta('<p>Fits</p>'), { pageOptions: phone });
    assert.equal(fits.outcome, 'pass');
  });

  await t.test(
    'a fixed box the edge cuts through is asked about, and fails with fields',
    async () => {
      // Fixed boxes don't widen the page, so nothing scrolls to what of them
      // lies past the edge.
      const banner = await scan(
        page(
          '.b{position:fixed;left:0;bottom:0;width:600px;display:flex} .b>button{flex:none;width:280px}',
          '<div class="b" id="banner"><button>Accept</button><button>Reject</button></div><p>Text</p>'
        )
      );
      assert.deepEqual(findings(banner), [
        ['banner', 'cantTell', 'CLIPPED_AT_VIEWPORT_EDGE', 'fail']
      ]);
      const fields = await scan(
        page(
          '.b{position:fixed;left:0;top:0;width:600px;display:flex} .b>label{flex:none;width:280px}',
          '<div class="b" id="bar"><label>From <input></label><label>To <input></label></div>'
        )
      );
      assert.deepEqual(findings(fields), [['bar', 'fail', 'CLIPPED_AT_VIEWPORT_EDGE', null]]);
      // Wholly past the edge, as an off-canvas menu waits, or held by a box
      // with a transform that scrolls it in: not reported.
      const offCanvas = await scan(
        page(
          '.m{position:fixed;top:0;left:100%;width:280px}',
          '<nav class="m">Menu</nav><p>Text</p>'
        )
      );
      assert.equal(offCanvas.outcome, 'pass');
    }
  );

  await t.test("an app's shell that scrolls is judged as the page", async () => {
    const shell = 'html,body{height:100%;overflow:hidden;margin:0} #app{height:100%;overflow:auto}';
    const div = await scan(
      page(shell, '<div id="app"><div id="w" style="width:600px">Wide text</div></div>')
    );
    assert.deepEqual(findings(div), [['w', 'fail', 'HORIZONTAL_SCROLL', null]]);
    const table = await scan(
      page(
        shell + ' table{width:600px}',
        '<div id="app"><table id="t" role="presentation"><tr><td>A</td><td>B</td></tr></table></div>'
      )
    );
    assert.deepEqual(findings(table), [['t', 'cantTell', 'WIDE_TABLE', 'fail']]);
  });

  await t.test('a layout table in a box that scrolls on its own is asked about', async () => {
    const check = await scan(
      page(
        '.s{overflow-x:auto} table{width:600px}',
        '<div class="s"><table id="t" role="presentation"><tr><td>A</td><td>B</td></tr></table></div>'
      )
    );
    assert.equal(check.outcome, 'cantTell');
    assert.deepEqual(findings(check)[0].slice(0, 3), ['t', 'cantTell', 'SCROLLS_IN_CONTAINER']);
  });

  await t.test(
    'only what a box holds is exempt, and an ellipsis covers text, not fields',
    async () => {
      const outerTable = await scan(
        page(
          '.s{overflow-x:auto;width:280px} form{width:600px;display:flex} label{flex:none;width:290px}',
          '<table role="presentation"><tr><td><div class="s"><form id="f"><label>A <input></label><label>B <input></label></form></div></td></tr></table>'
        )
      );
      assert.deepEqual(findings(outerTable), [['f', 'fail', 'SCROLLS_IN_CONTAINER', null]]);
      const ellipsis = await scan(
        page(
          '.card{overflow:hidden;text-overflow:ellipsis;border:1px solid} .row{display:flex;width:560px} .row>label{flex:none;width:270px}',
          '<div class="card"><div class="row" id="r"><label>A <input></label><label>B <input></label></div></div>'
        )
      );
      assert.deepEqual(findings(ellipsis), [['r', 'fail', 'CLIPPED_BY_CONTAINER', null]]);
    }
  );

  await t.test(
    'paint containment and a body that is a box of its own cut off content',
    async () => {
      for (const [css, body] of [
        [
          '.c{contain:paint}',
          '<div class="c"><div id="w" style="width:600px">Wide text</div></div>'
        ],
        [
          '.c{content-visibility:auto}',
          '<section class="c"><div id="w" style="width:600px">Wide text</div></section>'
        ],
        [
          'html{overflow-y:scroll} body{overflow-x:hidden}',
          '<div id="w" style="width:600px">Wide text</div>'
        ]
      ]) {
        const check = await scan(page(css, body));
        assert.equal(check.outcome, 'cantTell', css);
        assert.deepEqual(findings(check)[0].slice(0, 2), ['w', 'cantTell'], css);
      }
    }
  );

  await t.test("the verdict doesn't depend on where a box is scrolled", async () => {
    const html = page(
      '.s{overflow-x:auto;width:280px} form{width:600px;display:flex} label{flex:none;width:290px}',
      '<div class="s" id="s"><form id="f"><label>A <input></label><label>B <input></label></form></div>'
    );
    const p = await browser.newPage(PHONE);
    try {
      await p.setContent(html);
      await addBundle(p);
      const run = () =>
        p.evaluate(
          (o) =>
            window.a11ycore
              .runa11yCoreInPage(null, null, o, null)
              .checksResults.find((r) => r.ruleId === 'reflow-horizontal-scroll').outcome,
          { rules: { include: RULE_ID } }
        );
      assert.equal(await run(), 'fail');
      await p.evaluate(() => {
        document.getElementById('s').scrollLeft = 10000;
      });
      assert.equal(await run(), 'fail');
    } finally {
      await p.close();
    }
  });

  await t.test(
    'content cut at the start edge, which nothing scrolls to, is asked about',
    async () => {
      const ltr = await scan(
        page('#p{margin-left:-120px}', '<p id="p">Text that starts before the left edge</p>')
      );
      assert.deepEqual(
        ltr.occurrences.map((o) => [o.data.details.reasonCode, o.data.details.edge]),
        [['CLIPPED_AT_VIEWPORT_EDGE', 'left']]
      );
      const rtlPage = await scan(
        page(
          '#p{position:relative;left:120px}',
          '<p id="p">نص يبدأ بعد الحافة</p>',
          'lang="ar" dir="rtl"'
        )
      );
      assert.equal(rtlPage.occurrences[0].data.details.edge, 'right');
      // A box alone, a link wholly off-screen and image replacement cut no content.
      for (const [css, body] of [
        [
          '.bleed{margin:0 -8px;height:40px;background:#eee}',
          '<div class="bleed"></div><p>Text</p>'
        ],
        [
          '.skip{position:absolute;left:-9999px}',
          '<a class="skip" href="#m">Skip</a><main id="m">Text</main>'
        ],
        ['h1{text-indent:-9999px;width:200px}', '<h1>Logo</h1>']
      ]) {
        assert.equal((await scan(page(css, body))).outcome, 'pass', css);
      }
    }
  );

  await t.test("the body's writing mode and direction are the page's", async () => {
    const vertical = await scan(
      page('body{writing-mode:vertical-rl}', '<div style="width:600px">Wide</div>')
    );
    assert.equal(vertical.outcome, 'notApplicable');
    const rtlBody = await scan(
      page('#w{width:600px}', '<div id="w">Wide</div>').replace('<body>', '<body dir="rtl">')
    );
    assert.deepEqual(findings(rtlBody), [['w', 'fail', 'HORIZONTAL_SCROLL', null]]);
    assert.equal(rtlBody.occurrences[0].data.details.edge, 'left');
  });

  await t.test('an element in an open shadow root is named', async () => {
    const html = page(
      '',
      '<div id="host"></div><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML="<div id=\\"inner\\" style=\\"width:600px\\">Wide</div>"</script>'
    );
    assert.deepEqual(findings(await scan(html)), [['inner', 'fail', 'HORIZONTAL_SCROLL', null]]);
    // Left out of the scan, it can't be named.
    const off = await scan(html, { engineOptions: { includeShadowDom: false } });
    assert.equal(findings(off)[0][2], 'HORIZONTAL_SCROLL_UNATTRIBUTED');
  });

  await t.test('a box that hides downwards hides what is below it on purpose', async () => {
    const check = await scan(
      page(
        '.panel{overflow:hidden;height:40px} .row{width:560px}',
        '<div class="panel"><p>Shown</p><div class="row">Below the panel</div></div>'
      )
    );
    assert.equal(check.outcome, 'pass');
  });

  await t.test('only a field that is itself cut off fails', async () => {
    const card = (row, css = '') =>
      page(
        '.card{overflow:hidden;width:280px} .row{display:flex;width:560px} .row>*{flex:none;width:270px} ' +
          css,
        `<div class="card"><div class="row" id="r">${row}</div></div>`
      );
    const tier = async (html) => (await scan(html)).occurrences[0].occurrenceOutcome;
    assert.equal(await tier(card('<label>A <input></label><label>B <input></label>')), 'fail');
    // The field shows whole; only its help text is cut.
    assert.equal(
      await tier(
        card(
          '<input style="width:200px"><span style="width:300px">Help text cut off</span>',
          '.row>*{width:auto}'
        )
      ),
      'cantTell'
    );
    // Hidden, disabled, or a button: not a field a person fills in.
    assert.equal(
      await tier(
        card(
          '<div><input type="radio" name="s">1</div><div><input type="radio" name="s">2</div>',
          'input{display:none}'
        )
      ),
      'cantTell'
    );
    assert.equal(
      await tier(card('<label>A <input disabled></label><label>B <input disabled></label>')),
      'cantTell'
    );
    assert.equal(
      await tier(card('<button>Accept</button><input type="submit" value="Reject">')),
      'cantTell'
    );
    assert.equal(
      await tier(
        page(
          '.card{overflow:hidden;width:280px} .ed{width:560px}',
          '<div class="card"><div class="ed" contenteditable="plaintext-only">Edit</div></div>'
        )
      ),
      'fail'
    );
  });

  await t.test('excluded areas are left out', async () => {
    const check = await scan(page('.wide{width:600px}', '<div class="wide" id="x">Wide</div>'), {
      engineOptions: { excludeSelectors: ['#x'] }
    });
    assert.equal(findings(check).length, 0);
  });
});
