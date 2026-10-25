'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'invalid-field-error-message';

function run(body, opts = {}) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID],
    ...opts
  });
}

function codes(rule) {
  return rule.occurrences.map((o) => o.data.details.reasonCode);
}

test(`${RULE_ID}: notApplicable without an invalid field`, () => {
  assertRule(
    run(
      '<input aria-label="a"><input aria-label="b" aria-invalid="false"><textarea aria-label="c" aria-invalid="grammar"></textarea>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass with a shown, linked error message`, () => {
  assertRule(
    run(
      '<input aria-label="Email" aria-invalid="true" aria-errormessage="e"><p id="e">Enter an email address.</p>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
  assertRule(
    run(
      '<input aria-label="Email" aria-invalid="true" aria-describedby="e"><p id="e">Enter an email address.</p>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: ask, leaning fail, when aria-errormessage names a hidden message`, () => {
  const rule = assertRule(
    run(
      '<input aria-label="Email" aria-invalid="true" aria-errormessage="e"><p id="e" hidden>Enter an email address.</p>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'ERROR_MESSAGE_HIDDEN',
    ariaInvalid: 'true',
    errorMessageIds: ['e']
  });
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  // As for an empty message, the error may be told elsewhere; but the one
  // tied to the field can't be seen, so it leans fail.
  assert.equal(rule.occurrences[0].lean.toward, 'fail');
  assert.equal(rule.occurrences[0].lean.i18n.whyKey, 'invalidFieldErrorMessage_lean_why_hidden');
});

test(`${RULE_ID}: ask when the message is shown but empty`, () => {
  assert.deepEqual(
    codes(
      assertRule(
        run(
          '<input aria-label="City" aria-invalid="true" aria-errormessage="e"><span id="e"> </span>'
        ),
        RULE_ID,
        'cantTell'
      )
    ),
    ['ERROR_MESSAGE_EMPTY']
  );
});

test(`${RULE_ID}: text the page hides inside a shown message does not count`, () => {
  assert.deepEqual(
    codes(
      assertRule(
        run(
          '<input aria-label="City" aria-invalid="true" aria-errormessage="e"><p id="e"><span hidden>Enter a city.</span></p>'
        ),
        RULE_ID,
        'cantTell'
      )
    ),
    ['ERROR_MESSAGE_EMPTY']
  );
});

test(`${RULE_ID}: text brought back into view inside a visibility: hidden message is shown`, () => {
  const field = '<input aria-label="Email" aria-invalid="true" aria-errormessage="e">';
  assertRule(
    run(
      `${field}<div id="e" style="visibility:hidden"><span style="visibility:visible">Enter a valid email.</span></div>`
    ),
    RULE_ID,
    'pass'
  );
  assert.deepEqual(
    codes(
      assertRule(
        run(
          `${field}<div id="e" style="visibility:hidden"><span>Enter a valid email.</span></div>`
        ),
        RULE_ID,
        'cantTell'
      )
    ),
    ['ERROR_MESSAGE_HIDDEN']
  );
});

test(`${RULE_ID}: a shown message whose text aria-hidden keeps from assistive technology is asked about`, () => {
  const field = '<input aria-label="Email" aria-invalid="true" aria-errormessage="e">';
  const rule = assertRule(
    run(field + '<p id="e"><span aria-hidden="true">Enter a valid email.</span></p>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(codes(rule), ['ERROR_MESSAGE_ARIA_HIDDEN']);
});

test(`${RULE_ID}: a message that is aria-hidden itself, or inside an aria-hidden element, is asked about as hidden`, () => {
  const field = '<input aria-label="Email" aria-invalid="true" aria-errormessage="e">';
  for (const message of [
    '<p id="e" aria-hidden="true">Enter a valid email.</p>',
    '<div aria-hidden="true"><p id="e">Enter a valid email.</p></div>'
  ]) {
    const rule = assertRule(run(field + message), RULE_ID, 'cantTell');
    assert.deepEqual(codes(rule), ['ERROR_MESSAGE_HIDDEN'], message);
    assert.equal(rule.occurrences[0].data.details.hiddenBy, 'aria-hidden', message);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'invalidFieldErrorMessage_summary_cantTell_hiddenAria'
    );
    assert.equal(
      rule.occurrences[0].lean.i18n.whyKey,
      'invalidFieldErrorMessage_lean_why_hiddenAria'
    );
  }
  // A message nobody sees says nothing of aria-hidden.
  const hidden = assertRule(
    run(field + '<p id="e" hidden>Enter a valid email.</p>'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(hidden.occurrences[0].data.details.hiddenBy, undefined);
  // With a description, the error may be there, as for any hidden message.
  const described = assertRule(
    run(
      '<input aria-label="Email" aria-invalid="true" aria-errormessage="e" aria-describedby="d"><p id="d">Use name@example.com.</p><p id="e" aria-hidden="true">Enter a valid email.</p>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(codes(described), ['ERROR_MESSAGE_NOT_SHOWN_DESCRIBED']);
});

test(`${RULE_ID}: a value ARIA reads as true counts as invalid`, () => {
  assert.deepEqual(
    codes(
      assertRule(
        run(
          '<input aria-label="City" aria-invalid="yes" aria-errormessage="e"><span id="e" hidden>Bad</span>'
        ),
        RULE_ID,
        'cantTell'
      )
    ),
    ['ERROR_MESSAGE_HIDDEN']
  );
});

test(`${RULE_ID}: a visually hidden message is still shown to assistive technology, so it passes`, () => {
  assertRule(
    run(
      '<input aria-label="City" aria-invalid="true" aria-errormessage="e"><span id="e" style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Enter a city.</span>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: cantTell with no linked message, with uncertainty`, () => {
  const rule = assertRule(run('<input aria-label="Age" aria-invalid="true">'), RULE_ID, 'cantTell');
  assert.deepEqual(codes(rule), ['NO_ERROR_MESSAGE']);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: cantTell when aria-errormessage names no element`, () => {
  const rule = assertRule(
    run('<input aria-label="Code" aria-invalid="true" aria-errormessage="nope">'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(codes(rule), ['ERROR_MESSAGE_TARGET_MISSING']);
  assert.equal(rule.occurrences[0].uncertainty.code, 'runtime-dependent');
});

test(`${RULE_ID}: a hidden message with a description is asked about, not failed`, () => {
  const rule = assertRule(
    run(
      '<input aria-label="Date" aria-invalid="true" aria-errormessage="e" aria-describedby="d"><p id="e" hidden>x</p><p id="d">Date must be in the future.</p>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(codes(rule), ['ERROR_MESSAGE_NOT_SHOWN_DESCRIBED']);
});

test(`${RULE_ID}: one message shared by several fields`, () => {
  const rule = assertRule(
    run(
      '<input aria-label="A" aria-invalid="true" aria-errormessage="e"><input aria-label="B" aria-invalid="true" aria-errormessage="e"><p id="e" hidden>Fix the fields above.</p>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(codes(rule), ['ERROR_MESSAGE_HIDDEN', 'ERROR_MESSAGE_HIDDEN']);
});

test(`${RULE_ID}: hidden messages are read the same under includeHiddenElements`, () => {
  const rule = assertRule(
    run(
      '<input aria-label="Email" aria-invalid="true" aria-errormessage="e"><p id="e" hidden>Bad</p>',
      {
        engineOptions: { includeHiddenElements: true }
      }
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(codes(rule), ['ERROR_MESSAGE_HIDDEN']);
});

test(`${RULE_ID}: disabled and aria-hidden fields are left out`, () => {
  assertRule(
    run(
      '<input aria-label="A" disabled aria-invalid="true"><input aria-label="B" aria-hidden="true" tabindex="-1" aria-invalid="true">'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/invalid-field-error-message-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'invalid-field-error-message-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      o.html.match(/id="(ifem_case_\d+)"/)[1],
      o.data.details.reasonCode
    ]),
    [
      ['ifem_case_04', 'ERROR_MESSAGE_HIDDEN'],
      ['ifem_case_05', 'ERROR_MESSAGE_HIDDEN'],
      ['ifem_case_15', 'ERROR_MESSAGE_HIDDEN'],
      ['ifem_case_06', 'ERROR_MESSAGE_EMPTY'],
      ['ifem_case_07', 'NO_ERROR_MESSAGE'],
      ['ifem_case_08', 'ERROR_MESSAGE_TARGET_MISSING'],
      ['ifem_case_09', 'ERROR_MESSAGE_NOT_SHOWN_DESCRIBED'],
      ['ifem_case_16', 'ERROR_MESSAGE_ARIA_HIDDEN']
    ]
  );
});

function leans(body) {
  return assertRule(run(body), RULE_ID, 'cantTell').occurrences.map((o) => [
    o.data.details.reasonCode,
    o.lean ? o.lean.toward : null,
    o.lean ? o.lean.i18n.whyKey : null
  ]);
}

test(`${RULE_ID}: an empty message with no description leans fail`, () => {
  assert.deepEqual(
    leans(
      '<input aria-label="City" aria-invalid="true" aria-errormessage="e"><span id="e"> </span>'
    ),
    [['ERROR_MESSAGE_EMPTY', 'fail', 'invalidFieldErrorMessage_lean_why_empty']]
  );
});

test(`${RULE_ID}: a description that is a shown live region leans pass; a plain one has no lean`, () => {
  const field =
    '<input aria-label="Date" aria-invalid="true" aria-errormessage="e" aria-describedby="d"><p id="e" hidden>x</p>';
  assert.deepEqual(leans(field + '<p id="d" role="alert">Date must be in the future.</p>'), [
    [
      'ERROR_MESSAGE_NOT_SHOWN_DESCRIBED',
      'pass',
      'invalidFieldErrorMessage_lean_why_liveDescription'
    ]
  ]);
  assert.deepEqual(
    leans(field + '<p id="d" aria-live="polite">Date must be in the future.</p>')[0][1],
    'pass'
  );
  assert.deepEqual(leans(field + '<p id="d">Use dd/mm/yyyy.</p>'), [
    ['ERROR_MESSAGE_NOT_SHOWN_DESCRIBED', null, null]
  ]);
});

test(`${RULE_ID}: aria-hidden message text and a missing message lean fail only without a description`, () => {
  const hidden = '<p id="e"><span aria-hidden="true">Enter a valid email.</span></p>';
  assert.deepEqual(
    leans('<input aria-label="Email" aria-invalid="true" aria-errormessage="e">' + hidden),
    [['ERROR_MESSAGE_ARIA_HIDDEN', 'fail', 'invalidFieldErrorMessage_lean_why_ariaHidden']]
  );
  assert.deepEqual(
    leans(
      '<input aria-label="Email" aria-invalid="true" aria-errormessage="e" aria-describedby="d"><p id="d">Enter a valid email.</p>' +
        hidden
    ),
    [['ERROR_MESSAGE_ARIA_HIDDEN', null, null]]
  );
  assert.deepEqual(
    leans('<input aria-label="Code" aria-invalid="true" aria-errormessage="nope">'),
    [['ERROR_MESSAGE_TARGET_MISSING', 'fail', 'invalidFieldErrorMessage_lean_why_targetMissing']]
  );
  assert.deepEqual(
    leans(
      '<input aria-label="Code" aria-invalid="true" aria-errormessage="nope" aria-describedby="d"><p id="d">Six digits.</p>'
    ),
    [['ERROR_MESSAGE_TARGET_MISSING', null, null]]
  );
});
