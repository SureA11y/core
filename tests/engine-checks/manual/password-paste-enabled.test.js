'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'password-paste-enabled';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function scan(body) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`,
    { runOnly: [RULE_ID] }
  );
}

test(`${RULE_ID}: notApplicable when the page has no authentication field`, () => {
  assertRule(scan('<input type="text" onpaste="return false">'), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: notApplicable when a password field does not touch paste`, () => {
  assertRule(scan('<input type="password" id="a">'), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: never reports fail, whatever the handler looks like`, () => {
  // type: 'manual' puts this beyond the rule's own logic: the a11y policy
  // contract coerces a manual rule's would-be fail to cantTell centrally, so
  // a bug here still cannot produce one.
  for (const handler of ['return false', 'event.preventDefault()', 'handlePaste(e)']) {
    const rule = scan(`<input type="password" onpaste="${handler}">`).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.notStrictEqual(rule.outcome, 'fail');
  }
});

for (const [label, handler] of [
  ['return false', 'return false'],
  ['return !1', 'return !1'],
  ['return!1 with no space', 'return!1'],
  ['preventDefault then return false', 'event.preventDefault(); return false;'],
  ['preventDefault alongside stopPropagation', 'e.preventDefault(); e.stopPropagation();'],
  ['preventDefault()', 'event.preventDefault()'],
  ['returnValue = false', 'window.event.returnValue = false']
]) {
  test(`${RULE_ID}: cantTell when the inline handler cancels the paste via ${label}`, () => {
    const rule = assertRule(
      scan(`<input type="password" id="a" onpaste="${handler}">`),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'PASTE_CANCELLED');
    assert.ok(hasOccurrenceForId(rule, 'a'));
  });
}

test(`${RULE_ID}: a one-time-code field is in scope through autocomplete, not input type`, () => {
  const rule = assertRule(
    scan('<input type="text" autocomplete="one-time-code" id="a" onpaste="return false">'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: current-password and new-password are in scope too`, () => {
  for (const token of ['current-password', 'new-password']) {
    const rule = assertRule(
      scan(`<input type="text" autocomplete="${token}" id="a" onpaste="return false">`),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.ok(hasOccurrenceForId(rule, 'a'), `expected ${token} to be in scope`);
  }
});

// Cancelling is not the same as blocking: a split one-time-code field calls
// preventDefault and then distributes the digits across its boxes, and a
// password field strips stray whitespace the same way. Both help the user.
// Only a handler whose whole job is cancelling can be called blocking.
for (const [label, handler] of [
  [
    're-inserts the trimmed text',
    "e.preventDefault(); this.value = e.clipboardData.getData('text').trim()"
  ],
  ['distributes a one-time code', 'e.preventDefault(); fill(e)'],
  ['cancels only on some condition', 'if (!ok(e)) return false; return true;'],
  ['logs before cancelling', "track('paste'); return false"],
  ['delegates to a function', 'handlePaste(event)']
]) {
  test(`${RULE_ID}: cantTell, not fail, when the handler ${label}`, () => {
    const rule = assertRule(
      scan(`<input type="password" id="a" onpaste="${handler.replace(/"/g, '&quot;')}">`),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'PASTE_HANDLER_OPAQUE');
  });
}

for (const [label, handler] of [
  ['return true', 'return true'],
  ['return !0', 'return !0']
]) {
  test(`${RULE_ID}: notApplicable when the handler allows the paste outright via ${label}`, () => {
    assertRule(
      scan(`<input type="password" id="a" onpaste="${handler}">`),
      RULE_ID,
      'notApplicable',
      {
        minOccurrences: 0,
        maxOccurrences: 0
      }
    );
  });
}

for (const [label, attrs] of [
  ['disabled', 'disabled'],
  ['readonly', 'readonly']
]) {
  test(`${RULE_ID}: notApplicable when the field is ${label}, since it takes no input to block`, () => {
    assertRule(
      scan(`<input type="password" id="a" ${attrs} onpaste="return false">`),
      RULE_ID,
      'notApplicable',
      { minOccurrences: 0, maxOccurrences: 0 }
    );
  });
}

for (const token of ['cc-csc', 'cc-number']) {
  test(`${RULE_ID}: notApplicable when type=password masks a non-authentication purpose (${token})`, () => {
    // type="password" is a masking control, not only an authentication one --
    // a card security code is routinely masked the same way.
    assertRule(
      scan(`<input type="password" autocomplete="${token}" id="a" onpaste="return false">`),
      RULE_ID,
      'notApplicable',
      { minOccurrences: 0, maxOccurrences: 0 }
    );
  });
}

test(`${RULE_ID}: cantTell when the inline handler delegates, so the markup does not say whether it cancels`, () => {
  const rule = assertRule(
    scan('<input type="password" id="a" onpaste="handlePaste(event)">'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'PASTE_HANDLER_OPAQUE');
});

test(`${RULE_ID}: both a cancelled paste and an undetermined one are raised for review`, () => {
  const rule = assertRule(
    scan(
      '<input type="password" id="opaque" onpaste="handlePaste(event)">' +
        '<input type="password" id="blocked" onpaste="return false">'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.ok(hasOccurrenceForId(rule, 'blocked'));
  assert.ok(hasOccurrenceForId(rule, 'opaque'));
});

test(`${RULE_ID}: autocomplete="off" is not reported, since browsers override it for password managers`, () => {
  assertRule(scan('<input type="password" id="a" autocomplete="off">'), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: an aria-hidden field stays in scope, because it is still in the tab order`, () => {
  // The engine keeps native form controls eligible under aria-hidden on
  // purpose: browsers leave them tabbable, which is the anti-pattern
  // aria-hidden-focus reports. A user who can reach the field and type into
  // it can also be blocked from pasting into it.
  const rule = assertRule(
    scan('<input type="password" id="a" aria-hidden="true" onpaste="return false">'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: a field nobody can reach at all is out of scope`, () => {
  assertRule(
    scan('<div style="display:none"><input type="password" id="a" onpaste="return false"></div>'),
    RULE_ID,
    'notApplicable',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const rule = assertRule(
    scan('<input type="password" id="a" onpaste="return false">'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1 }
  );
  assert.strictEqual(rule.title, 'Authentication fields must not block pasting');
  assert.strictEqual(
    rule.occurrences[0].summary,
    'This authentication field has a paste handler whose only effect is to cancel the paste.'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/password-paste-enabled-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'password-paste-enabled-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });

  // Every field carrying a handler is raised for review, whether the handler
  // only cancels (01-04) or does more (05, 09-11).
  for (const id of [
    'ppe_case_01',
    'ppe_case_02',
    'ppe_case_03',
    'ppe_case_04',
    'ppe_case_05',
    'ppe_case_09',
    'ppe_case_10',
    'ppe_case_11'
  ]) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'ppe_case_06',
    'ppe_case_07',
    'ppe_case_08',
    'ppe_case_12',
    'ppe_case_13',
    'ppe_case_14'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
