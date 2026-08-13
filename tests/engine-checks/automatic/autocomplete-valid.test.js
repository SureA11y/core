'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'autocomplete-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no autocomplete attribute is present`, () => {
  const html = `<!doctype html><html><body><input></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for "off", which is a toggle rather than a field name`, () => {
  const html = `<!doctype html><html><body><input autocomplete="off"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a single recognized field-name token`, () => {
  const html = `<!doctype html><html><body><input autocomplete="email"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for shipping/billing + contact-modality + field name`, () => {
  const html = `<!doctype html><html><body><input autocomplete="section-billing shipping home tel"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for an unrecognized field-name token`, () => {
  const html = `<!doctype html><html><body><input id="a" autocomplete="emial"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'AUTOCOMPLETE_VALUE_INVALID');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><input id="a" autocomplete="emial"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'autocomplete attribute must be a valid autofill value');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/autocomplete-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'autocomplete-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'acv_case_05'));
  assert.ok(hasOccurrenceForId(rule, 'acv_case_06'));
  for (const id of ['acv_case_01', 'acv_case_02', 'acv_case_03', 'acv_case_04', 'acv_case_07']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// ACT 73f2c2 exempts controls where autocomplete cannot describe an input
// purpose.
test(`${RULE_ID}: notApplicable for the on/off toggle, disabled and fixed-value controls`, () => {
  for (const markup of [
    '<input type="text" autocomplete="off">',
    '<input type="text" autocomplete="ON">',
    '<input type="submit" autocomplete="email">',
    '<input type="checkbox" autocomplete="badname">',
    '<input autocomplete="badname" disabled>',
    '<input autocomplete="badname" aria-disabled="true">'
  ]) {
    const html = `<!doctype html><html><body>${markup}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a contact modality token needs a contact field after it`, () => {
  const bad = `<!doctype html><html><body><input autocomplete="work photo"></body></html>`;
  assertRule(runa11yCoreOnHtml(bad, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1
  });

  for (const value of ['work email', 'home tel', 'mobile tel-national', 'work impp']) {
    const html = `<!doctype html><html><body><input autocomplete="${value}"></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: full token order is accepted`, () => {
  for (const value of ['section-one shipping work email', 'billing email webauthn', 'photo']) {
    const html = `<!doctype html><html><body><input autocomplete="${value}"></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});
