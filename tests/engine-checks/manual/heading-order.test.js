'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'heading-order';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when fewer than two headings exist`, () => {
  const html = `<!doctype html><html><body><h1>A</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for consecutive heading levels`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3>C</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a later heading revisits a level already reached`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><h4>E</h4></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a heading skips a level`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 1);
  assert.equal(rule.occurrences[0].data.details.toLevel, 3);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Heading levels must not skip a level');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/heading-order-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'heading-order-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ho_case_01'));
});

test(`heading-order: respects contextSelector scoping (regression -- used to bypass helpers.queryAllSmart and always scan the whole document)`, () => {
  const html = `<!doctype html><html><body><div id="target"><p>Just some unrelated text.</p></div><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['heading-order'], contextSelector: '#target' });
  assertRule(result, 'heading-order', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
