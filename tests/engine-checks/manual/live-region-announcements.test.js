'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

// The page as it is when scanned. What the live-region hook records while
// the page runs is tested in core/live-region-hook.test.js and in Chromium.
const RULE_ID = 'live-region-announcements';

function run(body, engineOptions) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body><main>${body}</main></body></html>`,
    { runOnly: [RULE_ID], engineOptions }
  );
}

function details(rule) {
  return rule.occurrences.map((o) => [o.selector, o.data.details]);
}

test(`${RULE_ID}: notApplicable without a drawn live region`, () => {
  assertRule(
    run(
      '<p>Text</p><div role="region" aria-label="x"></div><div role="status" aria-live="off"></div><div hidden><div role="alert"></div></div><div style="display:none"><output></output></div><div role="timer"></div><div role="marquee"></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass for live regions assistive technology can reach`, () => {
  assertRule(
    run(
      '<div role="status"></div><div role="alert">Error</div><div role="log"></div><div aria-live="polite"></div><div aria-live="assertive" class="sr-only"></div><output>3</output><div role="timer" aria-live="polite"></div><div role="status" aria-busy="false"></div>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a live region inside or on aria-hidden is asked about`, () => {
  const rule = assertRule(
    run(
      '<div aria-hidden="true"><div id="a" role="status"></div></div><div id="b" aria-live="assertive" aria-hidden="true"></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#a', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'aria-hidden' }],
    ['#b', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'assertive', hiddenBy: 'aria-hidden' }]
  ]);
  assert.equal(rule.occurrences[0].uncertainty, undefined, 'a manual rule carries no uncertainty');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'liveRegionAnnouncements_summary_cantTell_ariaHidden'
  );
});

test(`${RULE_ID}: a live region in inert content is asked about`, () => {
  const rule = assertRule(run('<div inert><output id="o"></output></div>'), RULE_ID, 'cantTell');
  assert.deepEqual(details(rule), [
    ['#o', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'inert' }]
  ]);
});

test(`${RULE_ID}: a live region left busy is asked about`, () => {
  const rule = assertRule(
    run('<div id="l" role="log" aria-busy="true"></div>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#l', { reasonCode: 'LIVE_REGION_BUSY', politeness: 'polite' }]
  ]);
});

test(`${RULE_ID}: aria-live decides over the role, either way`, () => {
  const rule = assertRule(
    run(
      '<div aria-hidden="true"><div role="alert" aria-live="off"></div><div id="p" role="note" aria-live="polite"></div></div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(details(rule), [
    ['#p', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'aria-hidden' }]
  ]);
});

test(`${RULE_ID}: the scenario fixture`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const r = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(r, RULE_ID, 'cantTell');
  assert.deepEqual(
    rule.occurrences.map((o) => o.selector),
    ['#lra_case_05', '#lra_case_06', '#lra_case_07']
  );
});

// Leans: which way each undecided finding points.
function leanOn(html, id, ruleId = RULE_ID) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${html}</body></html>`,
    { runOnly: [ruleId] }
  );
  const rule = assertRule(result, ruleId, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `expected an occurrence on #${id}`);
  assert.strictEqual(occ.occurrenceOutcome || 'cantTell', 'cantTell');
  return occ.lean;
}

test(`${RULE_ID}: leans fail for a hidden live region with no dialog open`, () => {
  const lean = leanOn('<div aria-hidden="true"><div id="a" role="status"></div></div>', 'a');
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'liveRegionAnnouncements_lean_why_hidden');
});

test(`${RULE_ID}: no lean for a live region the page hid behind an open dialog`, () => {
  assert.strictEqual(
    leanOn(
      '<div aria-hidden="true"><div id="a" role="status"></div></div><div role="dialog" aria-modal="true"><button>OK</button></div>',
      'a'
    ),
    undefined
  );
});

test(`${RULE_ID}: a dialog shown in a shadow root explains a hidden live region`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  function lean(dialog) {
    const dom = createDom(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><div aria-hidden="true"><div id="a" role="status"></div></div><div id="host"></div></body></html>'
    );
    dom.window.document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = dialog;
    const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    return rule.occurrences[0].lean;
  }
  assert.strictEqual(
    lean('<div role="dialog" aria-label="Sign in"><button>OK</button></div>'),
    undefined
  );
  assert.strictEqual(
    lean('<div role="dialog" aria-label="Sign in" hidden><button>OK</button></div>').toward,
    'fail'
  );
});

test(`${RULE_ID}: the hook's findings lean fail unless the text was announced elsewhere`, () => {
  const {
    createDom: createLeanDom,
    runa11yCoreOnDom: runLeanOnDom
  } = require('../../helpers/runDomRulesOnHtml.js');
  const dom = createLeanDom(
    '<!doctype html><html lang="en"><body><div id="r1" role="status">Saved</div><div id="r2" role="status">Done</div><div id="r3" aria-live="polite">Done</div></body></html>'
  );
  const doc = dom.window.document;
  const el = (id) => doc.getElementById(id);
  Object.defineProperty(dom.window, Symbol.for('surea11y.liveRegions'), {
    value: Object.freeze({
      version: 1,
      early: true,
      announcements: [{ text: 'Done', politeness: 'polite', time: 2, element: el('r3') }],
      findings: [
        { code: 'LIVE_REGION_INSERTED_WITH_CONTENT', text: 'Saved', time: 1, element: el('r1') },
        { code: 'LIVE_REGION_SHOWN_AND_FILLED', text: 'Done', time: 1, element: el('r2') }
      ],
      dropped: { announcements: 0, findings: 0 }
    })
  });
  const rule = assertRule(runLeanOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  const inserted = rule.occurrences.find((o) => o.html.includes('id="r1"'));
  assert.strictEqual(inserted.data.details.reasonCode, 'LIVE_REGION_INSERTED_WITH_CONTENT');
  assert.strictEqual(inserted.lean.toward, 'fail');
  assert.strictEqual(inserted.lean.i18n.whyKey, 'liveRegionAnnouncements_lean_why_inserted');
  const shown = rule.occurrences.find((o) => o.html.includes('id="r2"'));
  assert.strictEqual(shown.data.details.reasonCode, 'LIVE_REGION_SHOWN_AND_FILLED');
  assert.strictEqual(shown.lean, undefined);
});

test(`${RULE_ID}: text given to a region behind an open modal dialog was not announced elsewhere`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  function lean(behindModal) {
    const dom = createDom(
      '<!doctype html><html lang="en"><body><div id="r2" role="status">Done</div><div id="r3" aria-live="polite">Done</div></body></html>'
    );
    const el = (id) => dom.window.document.getElementById(id);
    Object.defineProperty(dom.window, Symbol.for('surea11y.liveRegions'), {
      value: Object.freeze({
        version: 1,
        early: true,
        announcements: [
          { text: 'Done', politeness: 'polite', time: 2, order: 2, behindModal, element: el('r3') }
        ],
        findings: [
          {
            code: 'LIVE_REGION_SHOWN_AND_FILLED',
            text: 'Done',
            time: 1,
            order: 1,
            behindModal: false,
            element: el('r2')
          }
        ],
        dropped: { announcements: 0, findings: 0 }
      })
    });
    const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    return rule.occurrences[0].lean;
  }
  assert.strictEqual(lean(false), undefined);
  assert.strictEqual(lean(true).toward, 'fail');
});

// A live region behind an open modal <dialog>: the browser makes it inert,
// so what the page writes to it while the dialog is open is not announced.
// jsdom has no top layer: an open dialog with aria-modal="true" stands in
// for one opened with showModal() (modal-dialog.test.js).
const MODAL_DIALOG =
  '<dialog open aria-modal="true" aria-label="Sign in"><div id="in" role="status"></div><button>OK</button></dialog>';

test(`${RULE_ID}: a live region behind an open modal dialog is asked about, with no lean`, () => {
  const rule = assertRule(
    run('<div id="behind" role="status"></div>' + MODAL_DIALOG),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(details(rule), [
    ['#behind', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'modal' }]
  ]);
  const occ = rule.occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'liveRegionAnnouncements_summary_cantTell_modal');
  assert.equal(occ.i18n.hintKey, 'liveRegionAnnouncements_hint_cantTell_modal');
  assert.equal(occ.lean, undefined);
});

test(`${RULE_ID}: behind an open modal dialog, the dialog is what hides a region, whatever else does`, () => {
  const body =
    '<div inert><div id="inert" role="status"></div></div>' +
    '<div id="hidden" role="status" aria-hidden="true"></div>' +
    '<div id="both" role="status" inert aria-hidden="true"></div>' +
    MODAL_DIALOG.replace(
      '<button>',
      '<div inert><div id="inside" role="status"></div></div><button>'
    );
  const expected = [
    ['#inert', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'modal' }],
    ['#hidden', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'modal' }],
    ['#both', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'modal' }],
    // Inside the dialog, inert hides it.
    ['#inside', { reasonCode: 'LIVE_REGION_HIDDEN', politeness: 'polite', hiddenBy: 'inert' }]
  ];
  for (const engineOptions of [undefined, { includeHiddenElements: true }]) {
    const rule = assertRule(run(body, engineOptions), RULE_ID, 'cantTell', {
      minOccurrences: 4,
      maxOccurrences: 4
    });
    assert.deepEqual(details(rule), expected, JSON.stringify(engineOptions));
  }
  // With no modal open, what hides each region is said as before.
  const plain = assertRule(
    run('<div inert><div id="inert" role="status"></div></div>', { includeHiddenElements: true }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(plain.occurrences[0].data.details.hiddenBy, 'inert');
});

test(`${RULE_ID}: a live region inside the open modal dialog is judged as before`, () => {
  assertRule(run('<p>Page</p>' + MODAL_DIALOG), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: with no modal dialog open, a live region is judged as before`, () => {
  assertRule(run('<div id="behind" role="status"></div>'), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
  assertRule(
    run('<div id="behind" role="status"></div><dialog open aria-label="Note"><p>Hi</p></dialog>'),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: behind an open modal dialog, the hook's record decides the lean`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  // `opened` is the order at which the hook saw the dialog last opened, or
  // null for none; `behind` the order at which it saw the region behind it
  // given text, or null for none.
  function scan({ opened, behind, dropped = 0, log = true }) {
    const dom = createDom(
      '<!doctype html><html lang="en"><body><main><div id="behind" role="status">Saved</div></main>' +
        MODAL_DIALOG.replace('<dialog ', '<dialog id="d" ') +
        '</body></html>'
    );
    const doc = dom.window.document;
    const announcements = [];
    if (behind != null)
      announcements.push({
        text: 'Saved',
        politeness: 'polite',
        time: 1,
        order: behind,
        element: doc.getElementById('behind')
      });
    const dialogsOpened = [];
    if (opened != null)
      dialogsOpened.push({ time: 1, order: opened, element: doc.getElementById('d') });
    Object.defineProperty(dom.window, Symbol.for('surea11y.liveRegions'), {
      value: Object.freeze({
        version: 1,
        early: true,
        announcements,
        findings: [],
        ...(log ? { dialogsOpened } : {}),
        dropped: { announcements: 0, findings: 0, dialogsOpened: dropped }
      })
    });
    const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.hiddenBy, 'modal');
    return rule.occurrences[0].lean;
  }

  // Given its text after the dialog was opened: it was inert then.
  const lean = scan({ opened: 10, behind: 20 });
  assert.equal(lean.toward, 'fail');
  assert.deepEqual(lean.signals, [
    { signal: 'hidden-by', value: 'modal' },
    { signal: 'text-given-after-dialog-opened', value: true }
  ]);
  assert.equal(lean.i18n.whyKey, 'liveRegionAnnouncements_lean_why_modal');
  assert.equal(lean.i18n.cautionKey, 'liveRegionAnnouncements_lean_caution_modal');
  // The hook never saw it open: open since the hook started watching.
  assert.equal(scan({ opened: null, behind: 20 }).toward, 'fail');

  // Given its text before the dialog was opened, or never: no lean.
  assert.equal(scan({ opened: 20, behind: 10 }), undefined);
  assert.equal(scan({ opened: 10, behind: null }), undefined);
  // The hook dropped openings, or kept no record of them: it can't tell.
  assert.equal(scan({ opened: null, behind: 20, dropped: 1 }), undefined);
  assert.equal(scan({ opened: null, behind: 20, log: false }), undefined);
});

test(`${RULE_ID}: the hook's findings on a region behind an open modal dialog stay out`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const dom = createDom(
    '<!doctype html><html lang="en"><body><main><div id="behind" role="status">Saved</div></main>' +
      MODAL_DIALOG +
      '</body></html>'
  );
  Object.defineProperty(dom.window, Symbol.for('surea11y.liveRegions'), {
    value: Object.freeze({
      version: 1,
      early: true,
      announcements: [],
      findings: [
        {
          code: 'LIVE_REGION_INSERTED_WITH_CONTENT',
          text: 'Saved',
          time: 1,
          element: dom.window.document.getElementById('behind')
        }
      ],
      dropped: { announcements: 0, findings: 0 }
    })
  });
  const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LIVE_REGION_HIDDEN');
});
