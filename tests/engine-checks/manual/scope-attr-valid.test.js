'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'scope-attr-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no scope attribute is present`, () => {
  const html = `<!doctype html><html><body><table><tr><th>Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when scope is valid`, () => {
  const html = `<!doctype html><html><body><table><tr><th scope="col">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when scope value is invalid`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" scope="column">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SCOPE_ATTR_INVALID');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" scope="column">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'scope attribute must have a valid value');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/scope-attr-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'scope-attr-valid-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'sav_case_02'));
  assert.ok(!hasOccurrenceForId(rule, 'sav_case_01'));
});

test(`scope-attr-valid: respects contextSelector scoping (regression -- used to bypass helpers.queryAllSmart and always scan the whole document)`, () => {
  const html = `<!doctype html><html><body><div id="target"><p>Just some unrelated text.</p></div><table><tr><th id="a" scope="column">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['scope-attr-valid'], contextSelector: '#target' });
  assertRule(result, 'scope-attr-valid', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
