'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'complex-table-summary';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const TWO_HEADER_ROWS =
  '<tr><td></td><th colspan="2">2025</th></tr><tr><td></td><th>Q1</th><th>Q2</th></tr><tr><th>North</th><td>1</td><td>2</td></tr>';
const FLAGGED = `<table>${TWO_HEADER_ROWS}</table>`;

test(`${RULE_ID}: headers outside the first row and column make a complex table, flagged without a summary`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'complexTableNoSummary',
    reasons: ['headersOutsideFirstRowAndColumn'],
    hasCaption: false
  });
  assert.equal(occ.i18n.summaryKey, 'complexTableSummary_summary_cantTell');
});

test(`${RULE_ID}: a headers attribute makes a table complex; a caption is noted, not taken as the summary`, () => {
  const body =
    '<table><caption>Prices</caption><tr><th id="h">Item</th></tr><tr><td headers="h">Tea</td></tr></table>';
  const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.deepEqual(occ.data.details.reasons, ['headersAttribute']);
  assert.equal(occ.data.details.hasCaption, true);
});

test(`${RULE_ID}: aria-describedby or a summary attribute is taken as the summary`, () => {
  for (const attrs of ['aria-describedby="d"', 'summary="Quarters by region"']) {
    const body = `<p id="d">Quarters by region.</p><table ${attrs}>${TWO_HEADER_ROWS}</table>`;
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: simple tables, spanned first-row headers and layout tables are left out`, () => {
  for (const body of [
    '<table><tr><th>A</th><th>B</th></tr><tr><th>r</th><td>1</td></tr></table>',
    '<table><tr><th rowspan="2">R</th><th>A</th></tr><tr><td>1</td></tr></table>',
    '<table><tr><th colspan="2">Title</th></tr><tr><td>1</td><td>2</td></tr></table>',
    '<table role="presentation"><tr><td headers="x">1</td></tr></table>',
    '<table><tr><td>1</td></tr><tr><td>2</td><th role="cell">x</th></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/complex-table-summary-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'complex-table-summary-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['cts_case_01', 'cts_case_02']);
});
