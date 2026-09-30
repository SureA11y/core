'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');

const RULE_ID = 'data-table-headers-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rows = (n, cells) =>
  Array.from(
    { length: n },
    (_, r) => `<tr>${Array.from({ length: cells }, (_, c) => `<td>${r}-${c}</td>`).join('')}</tr>`
  ).join('');

test(`${RULE_ID}: a table of two rows and two columns with no header cell is asked about`, () => {
  const body = `<table id="t"><tr><td>Name</td><td>Age</td></tr><tr><td>Ann</td><td>34</td></tr></table>`;
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /id="t"/);
  assert.equal(occ.data.details.reasonCode, 'NO_HEADER_CELLS');
  assert.equal(occ.data.details.rows, 2);
  assert.equal(occ.data.details.columns, 2);
  assert.equal(occ.uncertainty.code, 'judgement-required');
  assert.equal(
    occ.summary,
    'This table has no header cells. If it is a data table, check whether its first row or column holds headers.'
  );
});

test(`${RULE_ID}: an ARIA table with no header role is asked about`, () => {
  const body =
    '<div role="table" id="t"><div role="row"><div role="cell">Name</div><div role="cell">Age</div></div><div role="row"><div role="cell">Ann</div><div role="cell">34</div></div></div>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /id="t"/);
});

test(`${RULE_ID}: spans count towards the size`, () => {
  const body =
    '<table><tr><td colspan="2">Opening hours</td></tr><tr><td>Monday</td><td>9-17</td></tr></table>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell');
  assert.equal(rule.occurrences[0].data.details.columns, 2);
});

test(`${RULE_ID}: a table with a header cell, a layout table, a small or empty table is not applicable`, () => {
  for (const body of [
    '<table><tr><th>Name</th><td>Age</td></tr><tr><td>Ann</td><td>34</td></tr></table>',
    '<table><tr><td role="columnheader">Name</td><td>Age</td></tr><tr><td>Ann</td><td>34</td></tr></table>',
    '<table><tr><td role="rowheader">Ann</td><td>34</td></tr><tr><td>Bob</td><td>40</td></tr></table>',
    '<div role="table"><div role="row"><div role="columnheader">A</div><div role="columnheader">B</div></div><div role="row"><div role="cell">1</div><div role="cell">2</div></div></div>',
    '<table role="presentation"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>',
    '<table role="none"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>',
    '<table><tr><td>a</td><td>b</td></tr></table>',
    '<table><tr><td>a</td></tr><tr><td>b</td></tr></table>',
    '<table><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>',
    '<div role="grid"><div role="row"><div role="gridcell">a</div><div role="gridcell">b</div></div><div role="row"><div role="gridcell">c</div><div role="gridcell">d</div></div></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a <th> given another role is not a header`, () => {
  const body =
    '<table><tr><th role="cell">Name</th><td>Age</td></tr><tr><td>Ann</td><td>34</td></tr></table>';
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: a nested table is checked on its own`, () => {
  const inner =
    '<table id="inner"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>';
  const body = `<table id="outer"><tr><th>Key</th><th>Value</th></tr><tr><td>Grid</td><td>${inner}</td></tr></table>`;
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /^<table id="inner"/);
});

test(`${RULE_ID}: opt-in, so a default run and a WCAG profile do not include it`, () => {
  const html = page(`<table>${rows(2, 2)}</table>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
  for (const engineOptions of [
    { profile: 'rgaa-4.1.2' },
    { tags: { include: 'rgaa' } },
    { rules: { include: 'rgaa-4.1.2-5.6' } }
  ]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the map links it to 5.6.1 and 5.6.2`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['5.6.1', '5.6.2']);
});

// A large table with no headers fails WCAG 1.3.1 through td-has-header, which
// does not link 5.6; RGAA 5.6 asks, since only a person can say the table is a
// data table.
test(`${RULE_ID}: WCAG 1.3.1 fails a large headerless table, RGAA 5.6 asks`, () => {
  const result = runa11yCoreOnHtml(page(`<table>${rows(4, 4)}</table>`), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const outcome = (id) => (result.rulesResults.find((r) => r.ruleId === id) || {}).outcome;
  assert.equal(outcome('wcag-1.3.1-info-and-relationships'), 'fail');
  assert.equal(outcome('rgaa-4.1.2-5.6'), 'cantTell');
});

test(`${RULE_ID}: RGAA 5.6 is not applicable when every table has header cells`, () => {
  const body = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Ann</td><td>34</td></tr></table>';
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const r = result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-5.6');
  assert.equal(r ? r.outcome : 'notApplicable', 'notApplicable');
});

test(`${RULE_ID}: i18n default is English, French under the fr locale`, () => {
  const html = page(`<table>${rows(2, 2)}</table>`);
  const en = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  assert.equal(en.title, 'Tables with no header cells are checked for unmarked headers');
  const fr = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    fr.title,
    'Les tableaux sans cellule d’en-tête sont vérifiés pour des en-têtes non structurés'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['dthr_case_01', 'dthr_case_02', 'dthr_case_03']);
});
