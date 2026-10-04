'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

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

const HTML4 =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';

test(`${RULE_ID}: aria-describedby is taken as the summary`, () => {
  const body = `<p id="d">Quarters by region.</p><table aria-describedby="d">${TWO_HEADER_ROWS}</table>`;
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

// RGAA 5.1.1 step 2 accepts summary only "dans les versions de HTML et de
// XHTML antérieures à HTML 5".
test(`${RULE_ID}: a summary attribute counts before HTML5 (or with no doctype), not in HTML5`, () => {
  const table = `<table summary="Quarters by region">${TWO_HEADER_ROWS}</table>`;
  for (const doctype of [HTML4, '']) {
    const html = `${doctype}<html lang="en"><head><title>t</title></head><body>${table}</body></html>`;
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const occ = assertRule(runa11yCoreOnHtml(page(table), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  }).occurrences[0];
  assert.equal(occ.data.details.summaryAttributeIgnored, true);
});

test(`${RULE_ID}: an ARIA table (role="table") with a header outside the first row and column is flagged`, () => {
  const body =
    '<div role="table" id="t">' +
    '<div role="row"><span role="cell"></span><span role="columnheader">2025</span></div>' +
    '<div role="row"><span role="cell"></span><span role="columnheader">Q1</span></div>' +
    '<div role="row"><span role="rowheader">North</span><span role="cell">1</span></div>' +
    '</div>';
  const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  }).occurrences[0];
  assert.ok(occ.html.includes('id="t"'));
  assert.deepEqual(occ.data.details.reasons, ['headersOutsideFirstRowAndColumn']);
  // Only aria-describedby gives an ARIA table a summary; summary is ignored.
  const described = body
    .replace('id="t"', 'id="t" aria-describedby="d" summary="x"')
    .concat('<p id="d">Quarters.</p>');
  assertRule(
    runa11yCoreOnHtml(`${HTML4}<html><body>${described}</body></html>`, RUN),
    RULE_ID,
    'pass'
  );
  const summaryOnly = body.replace('id="t"', 'id="t" summary="x"');
  assertRule(
    runa11yCoreOnHtml(`${HTML4}<html><body>${summaryOnly}</body></html>`, RUN),
    RULE_ID,
    'cantTell'
  );
});

test(`${RULE_ID}: scope="rowgroup"/"colgroup" makes a table complex`, () => {
  for (const [scope, reason] of [
    ['rowgroup', 'groupScope'],
    ['colgroup', 'groupScope']
  ]) {
    const body =
      '<table><tr><th>Region</th><th>City</th><th>Sales</th></tr>' +
      `<tr><th rowspan="2" scope="${scope}">North</th><td>Lille</td><td>1</td></tr>` +
      '<tr><td>Amiens</td><td>2</td></tr></table>';
    const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell').occurrences[0];
    assert.ok(occ.data.details.reasons.includes(reason), scope);
  }
});

test(`${RULE_ID}: first-row headers that each span a group of columns make a table complex`, () => {
  const body =
    '<table><tr><th colspan="2">2025</th><th colspan="2">2026</th></tr>' +
    '<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr></table>';
  const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.deepEqual(occ.data.details.reasons, ['groupSpanningHeader']);
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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'cts_case_01',
    'cts_case_02',
    'cts_case_06',
    'cts_case_07',
    'cts_case_08'
  ]);
});
