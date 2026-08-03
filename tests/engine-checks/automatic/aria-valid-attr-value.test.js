'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-valid-attr-value';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no aria-* attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only aria-* attribute is unrecognized (aria-valid-attr's concern)`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labell="typo"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a valid boolean value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for an invalid boolean value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="yes"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_VALUE_INVALID');
});

test(`${RULE_ID}: pass for a valid tristate value ("mixed")`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-checked="mixed"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for an invalid tristate value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-checked="maybe"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail for an invalid enumerated token`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-live="loud"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass for a valid enumerated token`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-live="assertive"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for a non-integer aria-level`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="abc"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass for a valid integer aria-level`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="3"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for an empty ID-reference-list value (allowEmpty, matches a reference engine's own standards table exactly)`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labelledby=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for an empty single-ID-reference value (allowEmpty)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox" aria-activedescendant=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for any non-empty string-typed attribute value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-label="Anything at all"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when idref-list references only a non-existent id`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labelledby="does_not_exist"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.valueReason, 'idref-list-none-found');
});

test(`${RULE_ID}: pass when idref-list is partially dangling (at least one id resolves) — verified 2026-07-21 to be an exact match for a reference engine's own idrefs validation, not a conservative guess`, () => {
  const html = `<!doctype html><html><body>
    <span id="lbl">Label</span>
    <div id="a" aria-labelledby="lbl does_not_exist"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a single-idref attribute references a non-existent id`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox" aria-activedescendant="does_not_exist"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.valueReason, 'idref-not-found');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="yes"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'aria-* attribute values must match their declared type');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-valid-attr-value-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-valid-attr-value-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFailIds = [
    'avav_case_06',
    'avav_case_07',
    'avav_case_08',
    'avav_case_09',
    'avav_case_14',
    'avav_case_15'
  ];
  const expectedNoOccIds = [
    'avav_case_01',
    'avav_case_02',
    'avav_case_03',
    'avav_case_04',
    'avav_case_05',
    'avav_case_10',
    'avav_case_11',
    'avav_case_12',
    'avav_case_13'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
