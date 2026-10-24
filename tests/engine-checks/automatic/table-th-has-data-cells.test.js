'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'table-th-has-data-cells';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when the table has no <th> at all`, () => {
  const html = `<!doctype html><html><body><table><tr><td>Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when there are no tables at all`, () => {
  const html = `<!doctype html><html><body><div>no tables here</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the table has both th and td cells`, () => {
  const html = `<!doctype html><html><body><table><tr><th>Name</th></tr><tr><td>Alice</td></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the table has th cells but zero td cells anywhere`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a">Name</th></tr><tr><th id="b">Age</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABLE_TH_NO_DATA_CELLS');
});

test(`${RULE_ID}: evaluates each table independently`, () => {
  const html = `<!doctype html><html><body>
    <table><tr><th>Good</th></tr><tr><td>data</td></tr></table>
    <table><tr><th id="bad">No data</th></tr></table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'bad'));
});

test(`${RULE_ID}: notApplicable for a table whose role removes its table semantics`, () => {
  for (const role of ['presentation', 'none']) {
    const html = `<!doctype html><html><body><table role="${role}"><tr><th>Spacer</th></tr></table></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: notApplicable when an explicit role overrides the header cell`, () => {
  const html = `<!doctype html><html><body><table><tr><th role="cell">Column A</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an explicit rowheader or columnheader role stays in scope`, () => {
  for (const role of ['rowheader', 'columnheader']) {
    const html = `<!doctype html><html><body><table><tr><th role="${role}">Column A</th></tr></table></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: notApplicable when the only header cell is hidden`, () => {
  for (const markup of [
    '<th style="display:none">Organization</th>',
    '<th aria-hidden="true">Organization</th>'
  ]) {
    const html = `<!doctype html><html><body><table><tr>${markup}</tr></table></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: notApplicable when the table itself is inside an aria-hidden subtree`, () => {
  const html = `<!doctype html><html><body><div aria-hidden="true"><table><tr><th>Name</th></tr></table></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a hidden header cell does not shield a visible one in the same table`, () => {
  const html = `<!doctype html><html><body><table><tr><th style="display:none">Hidden</th><th id="shown">Shown</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'shown'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><table><tr><th id="a">Name</th></tr></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, '<th> elements must describe at least one data cell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/table-th-has-data-cells-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'table-th-has-data-cells-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFailIds = ['thdc_case_02', 'thdc_case_03a', 'thdc_case_03b'];
  const expectedNoOccIds = ['thdc_case_01', 'thdc_case_04'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: ARIA roles are a fallback list read in any case (#91)`, () => {
  // role="foo grid" is a grid with a header and no data cell; role="GRID"
  // with a role="foo gridcell" cell has one; role="foo" on a <table> is no
  // role, so the table keeps its semantics.
  const html = `<!doctype html><html><body>
    <div role="foo grid"><div role="row"><div role="COLUMNHEADER" id="g1">H</div></div></div>
    <div role="GRID"><div role="row"><div role="columnheader" id="g2">H</div></div><div role="row"><div role="foo gridcell">d</div></div></div>
    <table role="foo"><tr><th id="t1">H</th></tr></table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'g1'));
  assert.ok(hasOccurrenceForId(rule, 't1'));
  assert.ok(!hasOccurrenceForId(rule, 'g2'));
});

// The HTML table model assigns a cell without a headers attribute to the
// headers above it in its column and before it in its row; one with a
// headers attribute only to those it names (ACT d0f69e).
test(`${RULE_ID}: asks about a header no data cell is assigned to`, () => {
  for (const [body, ids] of [
    // A column with no cell under its header (ACT d0f69e, Failed Example 1).
    [
      '<table><thead><tr><th id="a">Rate</th><th id="b">Value</th></tr></thead><tbody><tr><td>15%</td></tr></tbody></table>',
      ['b']
    ],
    // The only cell under it names another header (Failed Example 2).
    [
      '<table><tr><th id="a">Country</th><th id="b">Starting with a Z</th></tr><tr><td>Zambia</td><td headers="a">Zimbabwe</td></tr></table>',
      ['b']
    ],
    // A row header with no cell after it.
    [
      '<table><tr><th id="a" scope="col">Name</th></tr><tr><th id="b" scope="row">Ann</th></tr><tr><td>x</td></tr></table>',
      ['b']
    ],
    // An ARIA grid (Failed Example 3).
    [
      '<div role="grid"><div role="row"><div role="columnheader" id="a">Room</div><div role="columnheader" id="b">Occupant</div></div><div role="row"><div role="gridcell">1A</div></div><div role="row"><div role="gridcell">2A</div></div></div>',
      ['b']
    ]
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
      runOnly: [RULE_ID]
    });
    const rule = assertRule(result, RULE_ID, 'cantTell', {
      minOccurrences: ids.length,
      maxOccurrences: ids.length
    });
    for (const id of ids) assert.ok(hasOccurrenceForId(rule, id), `${id} in ${body}`);
    assert.ok(
      rule.occurrences.every((o) => o.data.details.reasonCode === 'TABLE_TH_NO_ASSIGNED_CELL')
    );
  }
});

test(`${RULE_ID}: a header a cell is assigned to passes, and a table with spans is not read`, () => {
  for (const body of [
    // Named by a headers attribute, though no cell is under it.
    '<table><tr><th id="a">A</th><th id="b">B</th></tr><tr><td headers="a b">x</td></tr></table>',
    // A row header with a cell after it, and the corner of a row and a
    // column of headers, which labels them.
    '<table><tr><th>Corner</th><th>Mon</th></tr><tr><th>Ann</th><td>x</td></tr></table>',
    // A header with scope colgroup is left out.
    '<table><tr><th scope="colgroup">G</th><th>B</th></tr><tr><td>x</td><td>y</td></tr></table>',
    // A span: the column of a cell is not its index.
    '<table><tr><th>A</th><th>B</th></tr><tr><td colspan="2">x</td></tr></table>',
    // A grid whose cells are placed by index.
    '<div role="grid"><div role="row"><div role="columnheader">A</div><div role="columnheader">B</div></div><div role="row"><div role="gridcell" aria-colindex="2">x</div></div></div>'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a table with no data cell still fails, beside a question in another`, () => {
  const html = `<!doctype html><html><body>
    <table><tr><th id="f">H</th></tr></table>
    <table><tr><th>A</th><th id="q">B</th></tr><tr><td>x</td></tr></table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const byId = (id) => rule.occurrences.find((o) => String(o.html || '').includes(`id="${id}"`));
  assert.equal(byId('f').occurrenceOutcome, 'fail');
  assert.equal(byId('q').occurrenceOutcome, 'cantTell');
});
