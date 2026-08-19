'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'table-headers-attr-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no cell has a headers attribute`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="h1">Name</th></tr><tr><td>Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when headers references a th in the same table`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="h1">Name</th></tr><tr><td id="a" headers="h1">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a referenced id does not exist`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="h1">Name</th></tr><tr><td id="a" headers="missing">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.invalid[0].reason, 'missing');
});

test(`${RULE_ID}: pass when the referenced element is a plain <td> (any cell counts, not just <th> -- ACT a25f45)`, () => {
  const html = `<!doctype html><html><body><table><tr><td id="h1">Name</td></tr><tr><td id="a" headers="h1">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the referenced element is not a table cell at all`, () => {
  const html = `<!doctype html><html><body><table><caption id="h1">Report</caption><tr><td id="a" headers="h1">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.invalid[0].reason, 'not-a-cell');
});

test(`${RULE_ID}: notApplicable when the table carries another explicit role`, () => {
  // An explicit role replaces the native table role, so there is no table
  // left for headers to describe.
  const html = `<!doctype html><html><body><table role="heading" aria-level="1"><tr><td id="a" headers="a">World</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an unknown role token leaves the native table role in place`, () => {
  const html = `<!doctype html><html><body><table role="bogus"><tr><td id="a" headers="nope">World</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the table has role="presentation" (ACT a25f45)`, () => {
  const html = `<!doctype html><html><body><table role="presentation"><tr><td id="h1">Name</td></tr><tr><td id="a" headers="h1">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the referenced th is in a different table`, () => {
  const html = `<!doctype html><html><body>
    <table><tr><th id="h1">Name</th></tr></table>
    <table><tr><td id="a" headers="h1">Alice</td></tr></table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.invalid[0].reason, 'different-table');
});

test(`${RULE_ID}: fail when a cell references itself`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a" headers="a">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.invalid[0].reason, 'self-reference');
});

test(`${RULE_ID}: reports one occurrence per cell listing all invalid ids`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="h1">Name</th></tr><tr><td id="a" headers="h1 missing1 missing2">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.invalid.length, 2);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table><tr><td id="a" headers="missing">Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Table cell "headers" attribute must reference valid header cells'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/table-headers-attr-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'table-headers-attr-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFailIds = ['thav_case_02', 'thav_case_03', 'thav_case_04', 'thav_case_05'];
  const expectedNoOccIds = [
    'thav_case_01',
    'thav_case_06',
    'thav_case_07',
    'thav_case_08',
    'thav_case_09'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
