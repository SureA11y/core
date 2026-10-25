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
