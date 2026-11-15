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

  await t.test('boxes that scroll or clip on their own are left alone', async () => {
    const check = await scan(
      page(
        '.wide{width:600px}',
        '<div style="overflow-x:auto"><div class="wide" id="a">In a scrolling box</div></div>' +
          '<pre style="overflow-x:auto" id="b"><code>const openingHours = { monday: "9:00", tuesday: "9:00" };</code></pre>' +
          '<p style="overflow-x:hidden" id="c">https://example.org/a/very/long/address/that/cannot/wrap/at/all</p>'
      )
    );
    assert.equal(check.outcome, 'pass');
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

  await t.test('excluded areas are left out', async () => {
    const check = await scan(page('.wide{width:600px}', '<div class="wide" id="x">Wide</div>'), {
      engineOptions: { excludeSelectors: ['#x'] }
    });
    assert.equal(findings(check).length, 0);
  });
});
