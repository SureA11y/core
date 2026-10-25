'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'focus-not-removed-by-script';

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
const run = (body, opts = { runOnly: [RULE_ID] }) => runa11yCoreOnHtml(page(body), opts);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// F55: focus is dropped as it arrives, on an element a keyboard user tabs to.
test(`${RULE_ID}: a handler that only blurs its own element in the tab order fails`, () => {
  for (const handler of [
    'this.blur()',
    'this.blur();',
    'blur()',
    'event.target.blur()',
    'event.currentTarget.blur(); return false;',
    'this . blur ( )',
    'this[&quot;blur&quot;]()',
    // F55's Example 3.
    'if(this.blur)this.blur();'
  ]) {
    const rule = assertRule(run(`<a href="/x" onfocus="${handler}">X</a>`), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepStrictEqual(reasons(rule), ['FOCUS_HANDLER_BLURS_SELF'], handler);
    const occ = rule.occurrences[0];
    assert.equal(occ.occurrenceOutcome, 'fail');
    assert.equal(occ.i18n.summaryKey, 'focusNotRemovedByScript_summary_fail_self');
    assert.equal(occ.i18n.hintKey, 'focusNotRemovedByScript_hint_fail');
    assert.equal(occ.uncertainty, undefined);
    assert.equal(occ.data.details.tabbable, true);
  }
});

test(`${RULE_ID}: blur() among other code, or on another element, is asked about with its own reason`, () => {
  for (const handler of [
    'if (locked) this.blur()',
    'track(); this.blur()',
    'document.getElementById(&quot;q&quot;).blur()',
    'window.blur()'
  ]) {
    const rule = assertRule(
      run(`<button type="button" onfocus="${handler}">Go</button>`),
      RULE_ID,
      'cantTell'
    );
    assert.deepStrictEqual(reasons(rule), ['FOCUS_HANDLER_CALLS_BLUR'], handler);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'focusNotRemovedByScript_summary_cantTell_calls'
    );
  }
});

test(`${RULE_ID}: focus() on another element is asked about with its own reason; on itself it isn't`, () => {
  for (const handler of [
    'document.getElementById(&quot;q&quot;).focus()',
    'document.body.focus()',
    'next[&quot;focus&quot;]()'
  ]) {
    const rule = assertRule(
      run(`<button type="button" onfocus="${handler}">Go</button><input id="q" aria-label="q">`),
      RULE_ID,
      'cantTell'
    );
    assert.deepStrictEqual(reasons(rule), ['FOCUS_HANDLER_MOVES_FOCUS'], handler);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'focusNotRemovedByScript_summary_cantTell_moves'
    );
  }
  assertRule(run('<a href="/x" onfocus="this.focus()">X</a>'), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: blur() on itself as a statement of its own leans fail; a conditional one does not`, () => {
  const occOf = (body) =>
    assertRule(run(body), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 })
      .occurrences[0];
  for (const handler of ['track(); this.blur()', 'if (a) { b() } this.blur();']) {
    const occ = occOf(`<a href="/x" onfocus="${handler}">X</a>`);
    assert.equal(occ.data.details.reasonCode, 'FOCUS_HANDLER_CALLS_BLUR', handler);
    assert.equal(occ.lean.toward, 'fail', handler);
    assert.equal(occ.lean.i18n.whyKey, 'focusNotRemovedByScript_lean_why_calls');
  }
  for (const handler of [
    'if (this.value) this.blur()',
    'setTimeout(function () { this.blur() }, 0)',
    'other.blur()',
    'if (done) return; this.blur()',
    'x && this.blur()'
  ]) {
    const occ = occOf(`<a href="/x" onfocus="${handler}">X</a>`);
    assert.equal(occ.data.details.reasonCode, 'FOCUS_HANDLER_CALLS_BLUR', handler);
    assert.equal(occ.lean, undefined, handler);
  }
});

test(`${RULE_ID}: focus() elsewhere leans pass on a focus-trap sentinel and fail on a named control`, () => {
  const occOf = (body, id) =>
    assertRule(run(body), RULE_ID, 'cantTell').occurrences.find((o) =>
      o.html.includes(`id="${id}"`)
    );
  const sentinel = occOf(
    '<div role="dialog" aria-label="d"><div id="s" tabindex="0" onfocus="document.getElementById(\'last\').focus()"></div><button>OK</button><button id="last">Cancel</button></div>',
    's'
  );
  assert.equal(sentinel.data.details.reasonCode, 'FOCUS_HANDLER_MOVES_FOCUS');
  assert.equal(sentinel.lean.toward, 'pass');
  assert.equal(sentinel.lean.i18n.whyKey, 'focusNotRemovedByScript_lean_why_sentinel');

  const control = occOf(
    '<button id="b" onfocus="document.getElementById(\'f\').focus()">Pay</button><input id="f" aria-label="Card">',
    'b'
  );
  assert.equal(control.data.details.reasonCode, 'FOCUS_HANDLER_MOVES_FOCUS');
  assert.equal(control.lean.toward, 'fail');
  assert.equal(control.lean.i18n.whyKey, 'focusNotRemovedByScript_lean_why_moves');

  // A conditional move on a control, or an unnamed element outside a trap: no lean.
  const conditional = occOf(
    '<button id="b" onfocus="if (!ok) document.getElementById(\'f\').focus()">Pay</button><input id="f" aria-label="Card">',
    'b'
  );
  assert.equal(conditional.lean, undefined);
  const loose = occOf(
    '<p>Intro</p><div id="s" tabindex="0" onfocus="document.body.focus()"></div><p>More</p>',
    's'
  );
  assert.equal(loose.data.details.reasonCode, 'FOCUS_HANDLER_MOVES_FOCUS');
  assert.equal(loose.lean, undefined);
});

test(`${RULE_ID}: a handler longer than 120 characters is cut and marked with an ellipsis`, () => {
  const handler = `${'track();'.repeat(20)}this.blur()`;
  const rule = assertRule(run(`<a href="/x" onfocus="${handler}">X</a>`), RULE_ID, 'cantTell');
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'FOCUS_HANDLER_CALLS_BLUR');
  assert.equal(occ.data.details.handler, `${handler.slice(0, 119)}…`);
  assert.equal(occ.i18n.params.handler, occ.data.details.handler);
});

test(`${RULE_ID}: an element outside the tab order that can still take focus is asked about`, () => {
  const rule = assertRule(
    run('<div tabindex="-1" onfocus="this.blur()">Panel</div>'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.tabbable, false);
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'FOCUS_HANDLER_BLURS_SELF');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'focusNotRemovedByScript_summary_cantTell_self'
  );
});

test(`${RULE_ID}: not applicable without a focusable, rendered element whose focus handler calls blur()`, () => {
  for (const body of [
    '<a href="/x">X</a>',
    '<a href="/x" onfocus="showTip(this)">X</a>',
    '<a href="/x" onfocus="blurry()">X</a>',
    '<span onfocus="this.blur()">not focusable</span>',
    '<button disabled onfocus="this.blur()">Off</button>',
    '<a href="/x" hidden onfocus="this.blur()">X</a>',
    '<a href="/x" onblur="this.blur()">X</a>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: fails WCAG 2.1.1 and 2.4.7 for a blur-only handler, and only asks for the rest`, () => {
  const result = run('<main><a href="/x" onfocus="this.blur()">X</a></main>', {});
  const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.equal(check.outcome, 'fail');
  for (const id of ['wcag-2.1.1-keyboard', 'wcag-2.4.7-focus-visible']) {
    const rollup = result.rulesResults.find((r) => r.ruleId === id);
    assert.ok(rollup, id);
    assert.equal(rollup.outcome, 'fail', id);
    assert.ok(check.rollupIds.includes(id), id);
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/focus-not-removed-by-script-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'focus-not-removed-by-script-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.data.details.reasonCode
  ]);
  assert.deepStrictEqual(got, [
    ['fnrs_case_01', 'FOCUS_HANDLER_BLURS_SELF'],
    ['fnrs_case_02', 'FOCUS_HANDLER_BLURS_SELF'],
    ['fnrs_case_03', 'FOCUS_HANDLER_CALLS_BLUR'],
    ['fnrs_case_07', 'FOCUS_HANDLER_BLURS_SELF']
  ]);
  assert.deepStrictEqual(
    rule.occurrences.map((o) => o.occurrenceOutcome),
    ['fail', 'fail', 'cantTell', 'cantTell']
  );
});
