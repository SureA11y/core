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

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  for (const id of ['acv_case_05', 'acv_case_06', 'acv_case_08', 'acv_case_09']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'acv_case_01',
    'acv_case_02',
    'acv_case_03',
    'acv_case_04',
    'acv_case_07',
    'acv_case_10',
    'acv_case_11'
  ]) {
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

// impp is a field name, not a contact modality: HTML's modality tokens are
// home, work, mobile, fax and pager. tel-local-prefix and tel-local-suffix
// are field names too.
test(`${RULE_ID}: pass impp on its own and the tel-local-prefix/suffix field names`, () => {
  for (const value of [
    'impp',
    'tel-local-prefix',
    'fax tel-local-suffix',
    'work tel-local-prefix'
  ]) {
    const html = `<!doctype html><html><body><input autocomplete="${value}"></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }

  const bad = `<!doctype html><html><body><input autocomplete="impp email"></body></html>`;
  assertRule(runa11yCoreOnHtml(bad, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1
  });
});

test(`${RULE_ID}: full token order is accepted`, () => {
  for (const value of ['section-one shipping work email', 'billing email webauthn', 'photo']) {
    const html = `<!doctype html><html><body><input autocomplete="${value}"></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

// The HTML Standard gives each autofill field name a control group, and each
// group is allowed only on some input types.
test(`${RULE_ID}: fail when the field name does not suit the input type`, () => {
  for (const markup of [
    '<input id="a" autocomplete="street-address">',
    '<input id="a" type="text" autocomplete="shipping street-address">',
    '<input id="a" type="number" autocomplete="email">',
    '<input id="a" type="date" autocomplete="bday-day">',
    '<input id="a" type="email" autocomplete="name">',
    '<input id="a" type="password" autocomplete="username">',
    '<input id="a" type="tel" autocomplete="tel-national">'
  ]) {
    for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
      const html = `<!doctype html><html><body>${markup}</body></html>`;
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
      assert.ok(hasOccurrenceForId(rule, 'a'), markup);
      assert.equal(
        rule.occurrences[0].data.details.reasonCode,
        'AUTOCOMPLETE_FIELD_CONTROL_MISMATCH',
        markup
      );
    }
  }
});

test(`${RULE_ID}: pass when the field name suits the control`, () => {
  for (const markup of [
    '<textarea autocomplete="street-address"></textarea>',
    '<select autocomplete="shipping street-address"><option>a</option></select>',
    '<input type="search" autocomplete="bday-day">',
    '<input type="number" autocomplete="bday-day">',
    '<input type="email" autocomplete="username">',
    '<input type="email" autocomplete="work email">',
    '<input type="password" autocomplete="current-password">',
    '<input type="tel" autocomplete="home tel">',
    '<input type="url" autocomplete="photo">',
    '<input type="month" autocomplete="cc-exp">',
    '<input type="date" autocomplete="bday">',
    '<input type="bogus" autocomplete="name">',
    '<input type="time" autocomplete="name">'
  ]) {
    const html = `<!doctype html><html><body>${markup}</body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: notApplicable for a control disabled by a disabled fieldset`, () => {
  const html = `<!doctype html><html><body><fieldset disabled><label>Nom <input autocomplete="nom"></label></fieldset></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a control in the first legend of a disabled fieldset is still checked`, () => {
  const html = `<!doctype html><html><body><fieldset disabled><legend><input id="a" autocomplete="nom"></legend></fieldset></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});
