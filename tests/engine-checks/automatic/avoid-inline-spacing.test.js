'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-avoid-inline-spacing';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no inline style is present`, () => {
  const html = `<!doctype html><html><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a spacing property is set without !important`, () => {
  const html = `<!doctype html><html><body><p style="letter-spacing:2px">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when letter-spacing is !important`, () => {
  const html = `<!doctype html><html><body><p id="a" style="letter-spacing:2px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.properties, ['letter-spacing']);
});

test(`${RULE_ID}: fail lists all forced properties together`, () => {
  const html = `<!doctype html><html><body><p id="a" style="line-height:1.8 !important; word-spacing:4px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepStrictEqual(rule.occurrences[0].data.details.properties, ['line-height', 'word-spacing']);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><p id="a" style="letter-spacing:2px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Inline style must not force text spacing with !important');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/avoid-inline-spacing-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'avoid-inline-spacing-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'ais_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'ais_case_03'));
  assert.ok(!hasOccurrenceForId(rule, 'ais_case_01'));
});
