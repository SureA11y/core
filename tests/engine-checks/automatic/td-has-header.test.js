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

// rowspan="0" grows the cell to the end of its row group (HTML, forming a
// table): a span like any other, so the table is left out (#120). A
// colspan of 0 is 1, and a negative rowspan is invalid, so 1.
const spanTable = (attr) =>
  `<!doctype html><html><body><table><tr><th ${attr}>Group</th><td>a</td><td>b</td><td>c</td></tr><tr><td>d</td><td>e</td><td>f</td></tr><tr><td>g</td><td>h</td><td>i</td></tr><tr><td>j</td><td>k</td><td>l</td></tr></table></body></html>`;

test(`${RULE_ID}: rowspan="0" is a span, so the table is left out`, () => {
  for (const attr of ['rowspan="0"', 'rowspan=" 0 "', 'rowspan="00"', 'rowspan="0x"']) {
    const result = runa11yCoreOnHtml(spanTable(attr), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: rowspan="1" or "-1" is no span, and the table is checked`, () => {
  for (const attr of ['rowspan="1"', 'rowspan="-1"']) {
    const result = runa11yCoreOnHtml(spanTable(attr), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });
  }
});

test(`${RULE_ID}: colspan="0" is no span`, () => {
  const html = `<!doctype html><html><body><table><tr><th colspan="0">A</th><th>B</th><th>C</th><th>D</th></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><td>5</td><td>6</td><td>7</td><td>8</td></tr><tr><td>9</td><td>10</td><td>11</td><td>12</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when every <td> in a large table has an implicit row/column header`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_WELL_HEADED}</table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// A large table with no header cell at all may be a layout table, which
// needs none (F46), or a data table missing them: asked about once.
test(`${RULE_ID}: cantTell, once, when a large table has no headers at all`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_NO_HEADERS}</table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TD_TABLE_NO_HEADERS');
});

test(`${RULE_ID}: fail when the table's headers leave a cell without one`, () => {
  const html = `<!doctype html><html><body><table>
    <tr><th>A</th><th>B</th><th>C</th><td></td></tr>
    <tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>
    <tr><td>5</td><td>6</td><td>7</td><td>8</td></tr>
    <tr><td>9</td><td>10</td><td>11</td><td>12</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  for (const o of rule.occurrences) {
    assert.equal(o.data.details.reasonCode, 'TD_NO_ASSOCIATED_HEADER');
    assert.equal(o.occurrenceOutcome, 'fail');
  }
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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Data cells in large tables must have an associated header');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/td-has-header-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'td-has-header-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  const onTable = (id) => rule.occurrences.filter((o) => o.selector.includes(`#${id}`));
  assert.deepEqual(
    onTable('tdh_case_01').map((o) => o.occurrenceOutcome),
    ['cantTell']
  );
  assert.deepEqual(
    onTable('tdh_case_09').map((o) => o.occurrenceOutcome),
    ['fail', 'fail', 'fail']
  );
  const expectedFlaggedIds = ['tdh_case_01', 'tdh_case_09'];
  const expectedNoOccIds = [
    'tdh_case_02',
    'tdh_case_03',
    'tdh_case_04',
    'tdh_case_05',
    'tdh_case_06',
    'tdh_case_07',
    'tdh_case_08'
  ];

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

const TABLE_4X4_ARIA_COLUMN_HEADERS = `
  <tr><td role="columnheader">Region</td><td role="columnheader">Q1</td><td role="columnheader">Q2</td><td role="columnheader">Q3</td></tr>
  <tr><td>North</td><td>1</td><td>2</td><td>3</td></tr>
  <tr><td>South</td><td>4</td><td>5</td><td>6</td></tr>
  <tr><td>East</td><td>7</td><td>8</td><td>9</td></tr>
`;

test(`${RULE_ID}: cells with role="columnheader"/"rowheader" are headers`, () => {
  const html = `<!doctype html><html><body><table>${TABLE_4X4_ARIA_COLUMN_HEADERS}</table></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass');
  const rows = `
    <tr><td role="rowheader">A</td><td>1</td><td>2</td><td>3</td></tr>
    <tr><td role="rowheader">B</td><td>4</td><td>5</td><td>6</td></tr>
    <tr><td role="rowheader">C</td><td>7</td><td>8</td><td>9</td></tr>
    <tr><td role="rowheader">D</td><td>1</td><td>2</td><td>3</td></tr>`;
  const byRow = `<!doctype html><html><body><table>${rows}</table></body></html>`;
  assertRule(runa11yCoreOnHtml(byRow, { runOnly: [RULE_ID] }), RULE_ID, 'pass');
});

// role="cell" makes a <th> a data cell, so it needs a header itself.
test(`${RULE_ID}: a <th> given another role is not a header`, () => {
  const html = `<!doctype html><html><body><table>
    <tr><th role="cell">a</th><th role="cell">b</th><th role="cell">c</th><th role="cell">d</th></tr>
    <tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>
    <tr><td>5</td><td>6</td><td>7</td><td>8</td></tr>
    <tr><td>9</td><td>10</td><td>11</td><td>12</td></tr></table></body></html>`;
  // With no header left, the table is asked about as one with none.
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TD_TABLE_NO_HEADERS');
});

test(`${RULE_ID}: a table whose role is not table, grid or treegrid is left out`, () => {
  for (const role of ['presentation', 'none']) {
    const html = `<!doctype html><html><body><table role="${role}">${TABLE_4X4_NO_HEADERS}</table></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');
  }
  const grid = `<!doctype html><html><body><table role="grid">${TABLE_4X4_NO_HEADERS}</table></body></html>`;
  assertRule(runa11yCoreOnHtml(grid, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: an empty cell needs no header; one holding an image does`, () => {
  const corner = `<!doctype html><html><body><table>
    <tr><td id="corner"></td><th>Q1</th><th>Q2</th><th>Q3</th></tr>
    <tr><th>North</th><td>1</td><td>2</td><td>3</td></tr>
    <tr><th>South</th><td>4</td><td>5</td><td>6</td></tr>
    <tr><th>East</th><td>7</td><td>8</td><td>9</td></tr></table></body></html>`;
  assertRule(runa11yCoreOnHtml(corner, { runOnly: [RULE_ID] }), RULE_ID, 'pass');
  const image = corner.replace(
    '<td id="corner"></td>',
    '<td id="corner"><img src="l.png" alt="Logo"></td>'
  );
  const rule = assertRule(runa11yCoreOnHtml(image, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(rule.occurrences[0].html.includes('id="corner"'));
});

test(`${RULE_ID}: same outcomes under wcag22-aa`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const run = (body) => runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(run(`<table>${TABLE_4X4_ARIA_COLUMN_HEADERS}</table>`), RULE_ID, 'pass');
  assertRule(
    run(`<table role="presentation">${TABLE_4X4_NO_HEADERS}</table>`),
    RULE_ID,
    'notApplicable'
  );
  assertRule(run(`<table>${TABLE_4X4_WELL_HEADED}</table>`), RULE_ID, 'pass');
});

test(`${RULE_ID}: the role attribute is a fallback list: a role="foo presentation" table is left out (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><table role="foo presentation">${TABLE_4X4_NO_HEADERS}</table></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an upper-case role resolves too: a role="PRESENTATION" table is left out (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><table role="PRESENTATION">${TABLE_4X4_NO_HEADERS}</table></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

function noHeadersLean(rows) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><table>${rows}</table></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TD_TABLE_NO_HEADERS');
  return rule.occurrences[0].lean;
}

test(`${RULE_ID}: a table with no headers leans fail on data signs, pass on layout signs, none on both or neither`, () => {
  const numbers = TABLE_4X4_NO_HEADERS;
  const lean = noHeadersLean(numbers);
  assert.equal(lean.toward, 'fail');
  assert.equal(lean.i18n.whyKey, 'tdHasHeader_lean_why_data');
  const words = '<tr><td>a</td><td>b</td><td>c</td><td>d</td></tr>';
  const boldRow =
    '<tr><td><b>Who</b></td><td><b>Name</b></td><td><b>Age</b></td><td><b>City</b></td></tr>';
  assert.equal(noHeadersLean(boldRow + words + words + words).toward, 'fail');
  const layoutRow =
    '<tr><td><img src="a.png" alt="Logo"></td><td><p>Welcome</p></td><td>x</td><td>y</td></tr>';
  const layout = noHeadersLean(layoutRow.repeat(4));
  assert.equal(layout.toward, 'pass');
  assert.equal(layout.i18n.whyKey, 'tdHasHeader_lean_why_layout');
  assert.equal(noHeadersLean(words.repeat(4)), undefined);
  assert.equal(noHeadersLean(layoutRow + numbers), undefined);
});

test(`${RULE_ID}: a fail names the <th> that is not counted as a header, and why`, () => {
  const body = '<tr><th>R</th><td>1</td><td>2</td><td>3</td></tr>'.repeat(4);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><table>
  <tr><th role="presentation">H0</th><th role="presentation">H1</th><th role="presentation">H2</th><th role="presentation">H3</th></tr>
  ${body}
</table></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 4,
    maxOccurrences: 4
  });
  // Only the <th role="presentation"> cells themselves: the row <th>s head the others.
  for (const o of rule.occurrences) {
    assert.equal(o.i18n.summaryKey, 'tdHasHeader_summary_fail_thRole');
    assert.equal(o.i18n.hintKey, 'tdHasHeader_hint_fail_thRole');
    assert.equal(
      o.summary,
      'This <th> has role="presentation", which makes it an ordinary cell, so it heads nothing and has no header of its own.'
    );
  }
});

test(`${RULE_ID}: a fail says the <th> above a cell has a role, or is hidden`, () => {
  const body = '<tr><td>a</td><td>1</td><td>2</td><td>3</td></tr>'.repeat(4);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><table>
  <tr><th role="cell">H0</th><th aria-hidden="true">H1</th><th>H2</th><th>H3</th></tr>
  ${body}
</table></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 9,
    maxOccurrences: 9
  });
  const role = rule.occurrences.filter(
    (o) => o.i18n.summaryKey === 'tdHasHeader_summary_fail_colRole'
  );
  const hidden = rule.occurrences.filter(
    (o) => o.i18n.summaryKey === 'tdHasHeader_summary_fail_colHidden'
  );
  assert.equal(role.length, 4);
  assert.equal(hidden.length, 4);
  assert.equal(
    role[0].summary,
    'This data cell has no header: the <th> above it ("H0") has role="cell", which makes it an ordinary cell.'
  );
  assert.equal(role[0].i18n.hintKey, 'tdHasHeader_hint_fail_colRole');
  assert.equal(
    role[0].hint,
    'Remove role="cell" from the header cells, or give them role="columnheader".'
  );
  assert.equal(
    hidden[0].summary,
    'This data cell has no header: the <th> above it ("H1") is hidden from screen readers by aria-hidden="true", so it heads nothing.'
  );
  assert.equal(hidden[0].i18n.hintKey, 'tdHasHeader_hint_fail_hidden');
  assert.deepEqual(hidden[0].data.details.notHeader, {
    cell: 'col',
    kind: 'hidden',
    text: 'H1',
    hiddenBy: 'aria-hidden="true"'
  });
  // The <th role="cell"> itself.
  assert.ok(rule.occurrences.some((o) => o.i18n.summaryKey === 'tdHasHeader_summary_fail_thRole'));
});

test(`${RULE_ID}: a fail says a header row of <td>s in <thead> heads nothing`, () => {
  const body = '<tr><td>a</td><td>1</td><td>2</td><td>3</td></tr>'.repeat(3);
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><table>
  <thead><tr><td>H0</td><td>H1</td><td>H2</td><td>H3</td></tr></thead>
  <tbody><tr><th>R</th><td>1</td><td>2</td><td>3</td></tr>${body}</tbody>
</table></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail');
  const head = rule.occurrences.filter(
    (o) => o.i18n.summaryKey === 'tdHasHeader_summary_fail_theadTd'
  );
  assert.equal(head.length, 4);
  assert.equal(
    head[0].summary,
    "This cell is in the table's <thead> but is a <td>, so it heads nothing, and the cells below it have no column header."
  );
  assert.equal(head[0].hint, 'Make the cells of the header row <th>.');
  const below = rule.occurrences.find(
    (o) => o.i18n.summaryKey === 'tdHasHeader_summary_fail_colTheadTd'
  );
  assert.equal(
    below.summary,
    'This data cell has no header: the cell above it in the <thead> ("H1") is a <td>, not a <th>, so it heads nothing.'
  );
  assert.equal(below.i18n.hintKey, 'tdHasHeader_hint_fail_theadTd');
});

test(`${RULE_ID}: a table with no header cells names the <th> that does not count`, () => {
  const body = '<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>'.repeat(4);
  const run = (head) =>
    assertRule(
      runa11yCoreOnHtml(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><table>${head}${body}</table></body></html>`,
        { runOnly: [RULE_ID] }
      ),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    ).occurrences[0];
  const role = run('<tr>' + '<th role="presentation">Year</th>'.repeat(4) + '</tr>');
  assert.strictEqual(role.i18n.summaryKey, 'tdHasHeader_summary_cantTell_noHeadersRole');
  assert.strictEqual(role.i18n.hintKey, 'tdHasHeader_hint_cantTell_noHeadersRole');
  assert.strictEqual(
    role.summary,
    'This table has no header cells that count: its <th> ("Year") has role="presentation", which makes it an ordinary cell. If it holds data, its cells have no headers.'
  );
  assert.strictEqual(role.data.details.reasonCode, 'TD_TABLE_NO_HEADERS');
  const hidden = run('<tr>' + '<th aria-hidden="true">Year</th>'.repeat(4) + '</tr>');
  assert.strictEqual(hidden.i18n.summaryKey, 'tdHasHeader_summary_cantTell_noHeadersHidden');
  assert.strictEqual(hidden.i18n.params.hiddenBy, 'aria-hidden="true"');
  const thead = run('<thead><tr>' + '<td>Year</td>'.repeat(4) + '</tr></thead>');
  assert.strictEqual(thead.i18n.summaryKey, 'tdHasHeader_summary_cantTell_noHeadersTheadTd');
  assert.strictEqual(
    thead.hint,
    'If the table holds data, make the cells of its header row <th>. If it only lays out content, give the table role="presentation".'
  );
});
