'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'td-has-header';

function hasOccurrenceUnderTableId(rule, tableId) {
  return (rule.occurrences || []).some(
    (o) => typeof o.selector === 'string' && o.selector.includes(`#${tableId}`)
  );
}

const TABLE_4X4_NO_HEADERS = `
  <tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>
  <tr><td>5</td><td>6</td><td>7</td><td>8</td></tr>
  <tr><td>9</td><td>10</td><td>11</td><td>12</td></tr>
  <tr><td>13</td><td>14</td><td>15</td><td>16</td></tr>
`;

const TABLE_4X4_WELL_HEADED = `
  <tr><th></th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
  <tr><th>North</th><td>1</td><td>2</td><td>3</td></tr>
  <tr><th>South</th><td>4</td><td>5</td><td>6</td></tr>
  <tr><th>East</th><td>7</td><td>8</td><td>9</td></tr>
`;

test(`${RULE_ID}: notApplicable when there are no tables`, () => {
  const html = `<!doctype html><html><body><p>No tables.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the table is below the 4x4 large-table threshold`, () => {
  const html = `<!doctype html><html><body><table><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the table has a colspan/rowspan (skipped, not risked)`, () => {
  const html = `<!doctype html><html><body><table><tr><th colspan="2">Group</th><th>C</th><th>D</th></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><td>5</td><td>6</td><td>7</td><td>8</td></tr><tr><td>9</td><td>10</td><td>11</td><td>12</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when every <td> in a large table has an implicit row/column header`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_WELL_HEADED}</table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a large table has no headers at all`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_NO_HEADERS}</table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 16, maxOccurrences: 16 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TD_NO_ASSOCIATED_HEADER');
});

test(`${RULE_ID}: pass when a <td> has an explicit headers attribute referencing a <th>`, () => {
  const html = `<!doctype html><html><body><table>
    <tr><th id="c1">A</th><th id="c2">B</th><th id="c3">C</th><th id="c4">D</th></tr>
    <tr><td headers="c1">1</td><td headers="c2">2</td><td headers="c3">3</td><td headers="c4">4</td></tr>
    <tr><td headers="c1">5</td><td headers="c2">6</td><td headers="c3">7</td><td headers="c4">8</td></tr>
    <tr><td headers="c1">9</td><td headers="c2">10</td><td headers="c3">11</td><td headers="c4">12</td></tr>
  </table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: an aria-hidden <th> is removed from the accessibility tree
// entirely -- a real screen reader never announces it, so it can't
// actually serve as another cell's row/column header, even though it's
// still structurally a <th>. A <td> relying solely on such a header was
// wrongly reported as having one (a false pass on this fail/pass-capable
// automatic rule).
test(`${RULE_ID}: an aria-hidden <th> does not count as a header for other cells`, () => {
  const html = `<!doctype html><html><body><table>
    <tr><th aria-hidden="true">H1</th><th>H2</th><th>H3</th><th>H4</th></tr>
    <tr><td>a</td><td>b</td><td>c</td><td>d</td></tr>
    <tr><td>a</td><td>b</td><td>c</td><td>d</td></tr>
    <tr><td>a</td><td>b</td><td>c</td><td>d</td></tr>
  </table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TD_NO_ASSOCIATED_HEADER');
});

test(`${RULE_ID}: an aria-hidden <td> is not flagged (it isn't exposed to AT, so it has no need for a header)`, () => {
  const html = `<!doctype html><html><body><table>
    <tr><th>H1</th><th>H2</th><th>H3</th><th>H4</th></tr>
    <tr><td aria-hidden="true">a</td><td>b</td><td>c</td><td>d</td></tr>
    <tr><td aria-hidden="true">a</td><td>b</td><td>c</td><td>d</td></tr>
    <tr><td aria-hidden="true">a</td><td>b</td><td>c</td><td>d</td></tr>
  </table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_NO_HEADERS}</table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Data cells in large tables must have an associated header');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/td-has-header-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'td-has-header-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 16, maxOccurrences: 16 });

  const expectedFlaggedIds = ['tdh_case_01'];
  const expectedNoOccIds = ['tdh_case_02', 'tdh_case_03', 'tdh_case_04', 'tdh_case_05'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceUnderTableId(rule, id), `Expected an occurrence under table id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(
      !hasOccurrenceUnderTableId(rule, id),
      `Did not expect an occurrence under table id="${id}"`
    );
  }
});
