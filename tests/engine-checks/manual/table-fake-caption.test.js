'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'table-fake-caption';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no tables`, () => {
  const html = `<!doctype html><html><body><p>No tables.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the table has a real caption`, () => {
  const html = `<!doctype html><html><body><table><caption>Title</caption><tr><td>1</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a table with no caption has a single-cell first row above multi-cell rows`, () => {
  const html = `<!doctype html><html><body><table><tr><td>Title</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SINGLE_CELL_FIRST_ROW_NO_CAPTION');
});

test(`${RULE_ID}: notApplicable when all rows have multiple cells`, () => {
  const html = `<!doctype html><html><body><table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: an aria-hidden row isn't part of the AT-perceived table
// structure at all, so it must not be treated as the table's "first row"
// for this positional heuristic. A hidden single-cell row above ordinary
// multi-cell rows was wrongly flagged, even though the real (AT-exposed)
// first row is an ordinary multi-cell row with no fake-caption shape at
// all.
test(`${RULE_ID}: an aria-hidden first row is not treated as the table's first row`, () => {
  const html = `<!doctype html><html><body><table><tr aria-hidden="true"><td>Hidden</td></tr><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table><tr><td>Title</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, "A table's first row should not stand in for a real <caption>");
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/table-fake-caption-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'table-fake-caption-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const expectedFlaggedIds = ['tfc_case_01'];
  const expectedNoOccIds = [
    'tfc_case_02',
    'tfc_case_03',
    'tfc_case_04',
    'tfc_case_05',
    'tfc_case_06'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// A layout table needs no caption, and a table named by aria-label,
// aria-labelledby or title already has a title (RGAA 5.4.1 step 2).
test(`${RULE_ID}: a table whose role is not table, grid or treegrid is left out`, () => {
  for (const role of ['presentation', 'none']) {
    const html = `<!doctype html><html><body><table role="${role}"><tr><td>Bienvenue</td></tr><tr><td>Menu</td><td>Contenu</td></tr></table></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
  const grid = `<!doctype html><html><body><table role="grid"><tr><td>Ventes</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
  assertRule(runa11yCoreOnHtml(grid, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: a table already named by aria-label, aria-labelledby or title is left out`, () => {
  for (const attrs of ['aria-label="Ventes 2025"', 'title="Ventes 2025"', 'aria-labelledby="h"']) {
    const html = `<!doctype html><html><body><h2 id="h">Ventes 2025</h2><table ${attrs}><tr><td>Ventes 2025</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
  // An aria-labelledby that resolves to nothing names nothing.
  const dangling = `<!doctype html><html><body><table aria-labelledby="missing"><tr><td>Ventes 2025</td></tr><tr><td>a</td><td>b</td></tr></table></body></html>`;
  assertRule(runa11yCoreOnHtml(dangling, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: layout and named tables are notApplicable under wcag22-aa and rgaa-4.1.2`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const layout = page(
    '<table role="presentation"><tr><td>Bienvenue</td></tr><tr><td>Menu</td><td>Contenu</td></tr></table>'
  );
  const named = page(
    '<table aria-label="Ventes 2025"><tr><td>Ventes 2025</td></tr><tr><td>a</td><td>b</td></tr></table>'
  );
  for (const profile of ['wcag22-aa', 'rgaa-4.1.2']) {
    for (const html of [layout, named]) {
      const result = runa11yCoreOnHtml(html, { engineOptions: { profile } });
      assertRule(result, RULE_ID, 'notApplicable');
    }
  }
});
