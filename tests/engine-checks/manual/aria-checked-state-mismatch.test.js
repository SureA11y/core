'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-aria-checked-state-mismatch';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no checkbox/radio with aria-checked present`, () => {
  const html = `<!doctype html><html><body><input type="text" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a native checkbox with no aria-checked at all`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" checked id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for role="checkbox" on a non-native element (scoped to native <input> only)`, () => {
  const html = `<!doctype html><html><body><div role="checkbox" aria-checked="false" id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when checkbox checked state matches aria-checked`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" checked aria-checked="true" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a checked checkbox has aria-checked="false"`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" checked aria-checked="false" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_CHECKED_STATE_MISMATCH');
  assert.equal(rule.occurrences[0].data.details.ariaChecked, 'false');
  assert.equal(rule.occurrences[0].data.details.actualState, 'true');
});

test(`${RULE_ID}: cantTell when an unchecked radio has aria-checked="true"`, () => {
  const html = `<!doctype html><html><body><input type="radio" aria-checked="true" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.type, 'radio');
});

test(`${RULE_ID}: cantTell when aria-checked="mixed" on an unchecked checkbox (static markup can never see .indeterminate, see implementation notes)`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" aria-checked="mixed" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.ariaChecked, 'mixed');
});

test(`${RULE_ID}: cantTell when aria-checked="mixed" is used on a radio (radio has no indeterminate state, always normalizes to "false")`, () => {
  const html = `<!doctype html><html><body><input type="radio" checked aria-checked="mixed" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.ariaChecked, 'false');
  assert.equal(rule.occurrences[0].data.details.actualState, 'true');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" checked aria-checked="false" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Native checkbox/radio aria-checked should match its actual state');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-checked-state-mismatch-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-checked-state-mismatch-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = ['acsm_case_04', 'acsm_case_05', 'acsm_case_06', 'acsm_case_07', 'acsm_case_08'];
  const expectedNoOccIds = ['acsm_case_01', 'acsm_case_02', 'acsm_case_03', 'acsm_case_09', 'acsm_case_10'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
