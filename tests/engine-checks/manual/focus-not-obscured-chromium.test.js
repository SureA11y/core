'use strict';

/**
 * focus-not-obscured-minimum (WCAG 2.4.11) and focus-not-obscured-enhanced
 * (2.4.12) in a real browser, the only place they can measure: which
 * elements in the tab order a box the page keeps in place can hide, given
 * the page's scroll-padding, confirmed by the browser's hit test, with the
 * page scrolled back where it was.
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

const RULE_ID = 'focus-not-obscured-minimum';
const ENHANCED = 'focus-not-obscured-enhanced';
const { addBundle } = require('../../helpers/browserBundle');

// Links far enough down the page to be scrolled anywhere in the window.
const LINKS = (n, prefix = 'Link') =>
  '<p style="height:900px;margin:0"></p>' +
  Array.from({ length: n }, (_, i) => `<p><a href="#${i}">${prefix} ${i}</a> text</p>`).join('') +
  '<p style="height:900px;margin:0"></p>';
const FOOTER = (css = '') =>
  `<div id="footer" style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#fff;${css}">Footer</div>`;
const doc = (body, css = '') =>
  `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0}${css}</style></head><body>${body}</body></html>`;

test(`${RULE_ID} and ${ENHANCED} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, { scrollY = 0 } = {}) {
    const p = await browser.newPage({ viewport: { width: 1024, height: 700 } });
    try {
      await p.setContent(html);
      await addBundle(p);
      return await p.evaluate(
        ([ids, y]) => {
          window.scrollTo(0, y);
          const before = window.scrollY;
          const r = window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { rules: { include: ids } },
            null
          );
          const out = { restored: window.scrollY === before };
          for (const c of r.checksResults) {
            out[c.ruleId] = {
              outcome: c.outcome,
              error: c.error || null,
              findings: c.occurrences.map((o) => ({
                selector: o.selector,
                code: o.data.details.reasonCode,
                metrics: o.data.details.metrics,
                openedByUser: o.data.details.openedByUser,
                lean: o.lean ? o.lean.toward : null,
                whyKey: o.lean ? o.lean.i18n.whyKey : null,
                summaryKey: o.i18n.summaryKey,
                hintKey: o.i18n.hintKey,
                hint: o.hint
              }))
            };
          }
          return out;
        },
        [[RULE_ID, ENHANCED], scrollY]
      );
    } finally {
      await p.close();
    }
  }
  const brief = (res, id) =>
    res[id].findings.map((f) => `${f.selector} ${f.code}${f.lean ? ' lean ' + f.lean : ''}`);

  await t.test('the fixture: each case as its title says', async () => {
    const html = fs.readFileSync(
      path.join(__dirname, '../..', 'fixtures', 'focus-not-obscured-all-scenarios.html'),
      'utf8'
    );
    const res = await scan(html);
    assert.equal(res[RULE_ID].outcome, 'cantTell');
    assert.deepEqual(brief(res, RULE_ID), [
      '#fno_case_01 FOCUS_OBSCURED_ENTIRELY lean fail',
      '#fno_case_04 FOCUS_OBSCURED_ENTIRELY'
    ]);
    assert.deepEqual(brief(res, ENHANCED), [
      '#fno_case_01 FOCUS_OBSCURED_ENTIRELY lean fail',
      '#fno_case_03 FOCUS_OBSCURED_PARTLY lean fail',
      '#fno_case_04 FOCUS_OBSCURED_ENTIRELY'
    ]);
    const first = res[RULE_ID].findings[0];
    assert.equal(first.metrics.entirelyCount, 6);
    assert.equal(first.metrics.side, 'bottom');
    assert.equal(first.metrics.paddingNeededPx, 60);
    assert.equal(first.whyKey, 'focusNotObscuredMinimum_lean_why_entirely');
    // The panel a button opened: no lean, and said so.
    assert.equal(res[RULE_ID].findings[1].openedByUser, true);
    // The variant reports in its own words; its lean keeps the base's keys.
    const enh = res[ENHANCED].findings[1];
    assert.equal(enh.summaryKey, 'focusNotObscuredEnhanced_summary_cantTell_partly');
    assert.equal(enh.hintKey, 'focusNotObscuredEnhanced_hint_cantTell_edge');
    assert.equal(enh.whyKey, 'focusNotObscuredMinimum_lean_why_partly');
    assert.equal(enh.metrics.partlyCount, 6);
    assert.ok(res.restored);
  });

  await t.test(
    'a scroll-padding as large as the box clears it; a smaller one does not',
    async () => {
      const enough = await scan(doc(LINKS(20) + FOOTER(), 'html{scroll-padding-bottom:80px}'));
      assert.equal(enough[RULE_ID].outcome, 'pass');
      assert.equal(enough[ENHANCED].outcome, 'pass');
      const short = await scan(doc(LINKS(20) + FOOTER(), 'html{scroll-padding-bottom:40px}'));
      assert.deepEqual(brief(short, RULE_ID), ['#footer FOCUS_OBSCURED_ENTIRELY lean fail']);
      const m = short[RULE_ID].findings[0].metrics;
      assert.equal(m.coverPx, 40);
      assert.equal(m.scrollPaddingPx, 40);
      assert.equal(m.paddingNeededPx, 80);
      assert.match(short[RULE_ID].findings[0].hint, /scroll-padding-bottom of at least 80px/);
    }
  );

  await t.test('stacked sticky bars: the padding asked for covers both', async () => {
    const bars =
      '<header id="head" style="position:sticky;top:0;height:56px;background:#fff;z-index:2">Site</header>' +
      '<div id="tools" style="position:sticky;top:56px;height:40px;background:#eef;z-index:1">Tools</div>';
    const res = await scan(doc(bars + LINKS(20)), { scrollY: 600 });
    assert.deepEqual(brief(res, RULE_ID), [
      '#head FOCUS_OBSCURED_ENTIRELY lean fail',
      '#tools FOCUS_OBSCURED_ENTIRELY lean fail'
    ]);
    assert.equal(res[RULE_ID].findings[0].metrics.side, 'top');
    assert.equal(res[RULE_ID].findings[1].metrics.paddingNeededPx, 96);
    assert.ok(res.restored, 'the page is scrolled back where it was');
    const cleared = await scan(doc(bars + LINKS(20), 'html{scroll-padding-top:96px}'), {
      scrollY: 600
    });
    assert.equal(cleared[RULE_ID].outcome, 'pass');
  });

  await t.test(
    'a script-made modal leaves the page focusable behind it; showModal() does not',
    async () => {
      const scripted = await scan(
        doc(
          LINKS(5) +
            '<div id="backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.5)">' +
            '<div role="dialog" aria-modal="true" aria-label="Offer" style="background:#fff;margin:60px;padding:20px">Offer <button>Close</button></div></div>'
        )
      );
      assert.deepEqual(brief(scripted, RULE_ID), [
        '#backdrop FOCUS_OBSCURED_BEHIND_MODAL lean fail'
      ]);
      assert.equal(
        scripted[RULE_ID].findings[0].whyKey,
        'focusNotObscuredMinimum_lean_why_behindModal'
      );
      assert.deepEqual(brief(scripted, ENHANCED), [
        '#backdrop FOCUS_OBSCURED_BEHIND_MODAL lean fail'
      ]);
      const native = await scan(
        doc(
          LINKS(5) +
            '<dialog id="d">Offer <button>Close</button></dialog><script>document.getElementById("d").showModal()</script>'
        )
      );
      assert.notEqual(native[RULE_ID].outcome, 'cantTell');
    }
  );

  await t.test('what hides nothing is not asked about', async () => {
    for (const [name, html] of [
      ['a fixed box that draws nothing', doc(LINKS(20) + FOOTER('background:transparent'))],
      ['a fixed box at opacity 0', doc(LINKS(20) + FOOTER('opacity:0'))],
      [
        'links too high on the page to reach a bottom box',
        doc('<p><a href="#a">A</a></p><p><a href="#b">B</a></p>' + FOOTER())
      ],
      ['a page with no fixed or sticky box', doc(LINKS(20))]
    ]) {
      const res = await scan(html);
      assert.equal(res[RULE_ID].outcome, 'pass', name);
      assert.equal(res[ENHANCED].outcome, 'pass', name);
    }
  });

  await t.test('an element taller than the box is hidden in part only', async () => {
    const res = await scan(
      doc(
        '<p style="height:900px;margin:0"></p><button style="display:block;height:120px;width:200px">Tall</button><p style="height:900px;margin:0"></p>' +
          FOOTER()
      )
    );
    assert.equal(res[RULE_ID].outcome, 'pass');
    assert.deepEqual(brief(res, ENHANCED), ['#footer FOCUS_OBSCURED_PARTLY lean fail']);
  });

  await t.test(
    'a box in the middle of the window asks to move it, not to pad the page',
    async () => {
      const res = await scan(
        doc(
          LINKS(20) +
            '<div id="mid" style="position:fixed;top:300px;left:0;right:0;height:80px;background:#fff">Promo</div>'
        )
      );
      assert.deepEqual(brief(res, RULE_ID), ['#mid FOCUS_OBSCURED_ENTIRELY lean fail']);
      assert.equal(res[RULE_ID].findings[0].metrics.side, 'middle');
      assert.equal(
        res[RULE_ID].findings[0].hintKey,
        'focusNotObscuredMinimum_hint_cantTell_middle'
      );
    }
  );

  await t.test('the page is scrolled back where it was', async () => {
    const res = await scan(doc(LINKS(30) + FOOTER()), { scrollY: 450 });
    assert.equal(res[RULE_ID].outcome, 'cantTell');
    assert.ok(res.restored);
  });
});
