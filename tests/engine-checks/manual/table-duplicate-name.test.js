'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-table-duplicate-name';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when the table has no summary attribute`, () => {
  const html = `<!doctype html><html><body><table><caption>Sales</caption><tr><td>1</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when summary and caption differ`, () => {
  const html = `<!doctype html><html><body><table summary="Extra detail"><caption>Sales</caption><tr><td>1</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when summary duplicates the caption`, () => {
  const html = `<!doctype html><html><body><table id="a" summary="Sales data"><caption>Sales data</caption><tr><td>1</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_CAPTION_SUMMARY_DUPLICATE');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table id="a" summary="Sales data"><caption>Sales data</caption><tr><td>1</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Table caption must not duplicate its summary attribute');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/table-duplicate-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'table-duplicate-name-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'tdn_case_02'));
  assert.ok(!hasOccurrenceForId(rule, 'tdn_case_01'));
});
