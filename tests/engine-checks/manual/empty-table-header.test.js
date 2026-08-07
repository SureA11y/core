'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'empty-table-header';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no th is present`, () => {
  const html = `<!doctype html><html><body><table><tr><td>1</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when th has text content`, () => {
  const html = `<!doctype html><html><body><table><tr><th>Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when th is empty`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_HEADER_EMPTY');
});

test(`${RULE_ID}: cantTell when th is named only via aria-label, no visible text`, () => {
  // Regression for a false positive: a table with icon-only column headers
  // (<th aria-label="Chrome">) — this rule previously accepted aria-label as
  // sufficient, but aria-label is ignored on <th> in practice by screen
  // readers; only visible text reliably works.
  const html = `<!doctype html><html><body><table><tr><th id="a" aria-label="Chrome"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_HEADER_NAME_NOT_VISIBLE_TEXT');
  assert.equal(rule.occurrences[0].data.details.ariaName, 'Chrome');
});

test(`${RULE_ID}: notApplicable when th has visible text even alongside an aria-label`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" aria-label="Chrome">Chrome</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a non-<th> element has role="columnheader" and is empty`, () => {
  // Regression for a coverage gap: this rule only ever queried native <th>,
  // missing ARIA-role-based headers (`th:not([role]), [role="columnheader"],
  // [role="rowheader"]`) entirely in e.g. role="grid" widgets.
  const html = `<!doctype html><html><body><div role="columnheader" id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_HEADER_EMPTY');
});

test(`${RULE_ID}: cantTell when a non-<th> element has role="rowheader" and is empty`, () => {
  const html = `<!doctype html><html><body><div role="rowheader" id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when an empty th has role="presentation"`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" role="presentation"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when an empty th explicitly restates role="columnheader"`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" role="columnheader"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Table header cells must not be empty');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/empty-table-header-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'empty-table-header-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  assert.ok(hasOccurrenceForId(rule, 'eth_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'eth_case_03'));
  assert.ok(hasOccurrenceForId(rule, 'eth_case_04'));
  assert.ok(hasOccurrenceForId(rule, 'eth_case_05'));
  assert.ok(!hasOccurrenceForId(rule, 'eth_case_01'));
  assert.ok(!hasOccurrenceForId(rule, 'eth_case_06'));
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: plain el.textContent includes text from aria-hidden
// descendants, which a real screen reader never announces -- exactly the
// AT-announcement gap this rule's own header comment extensively
// researched. A <th> whose only text comes from an aria-hidden descendant
// was wrongly treated as having visible text and never flagged, even
// though AT announces nothing for it at all.
test(`${RULE_ID}: a th whose only text comes from an aria-hidden descendant is flagged as empty (AT announces nothing for it)`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a"><span aria-hidden="true">Name</span></th></tr><tr><td>Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_HEADER_EMPTY');
});

test(`${RULE_ID}: a fully aria-hidden th is not flagged (it isn't part of the AT-perceived table structure)`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" aria-hidden="true">Name</th></tr><tr><td>Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`empty-table-header: respects contextSelector scoping (regression -- used to bypass helpers.queryAllSmart and always scan the whole document)`, () => {
  const html = `<!doctype html><html><body><div id="target"><p>Just some unrelated text.</p></div><table><tr><th id="a"></th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['empty-table-header'],
    contextSelector: '#target'
  });
  assertRule(result, 'empty-table-header', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
