'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'layout-table-no-data-markup';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const layout = (inner, attrs = 'role="presentation"') =>
  `<table ${attrs}>${inner}<tr><td>a</td><td>b</td></tr></table>`;

test(`${RULE_ID}: a layout table with plain cells passes`, () => {
  for (const role of ['presentation', 'none', 'NONE presentation']) {
    const html = page(layout('', `role="${role}"`));
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a page without layout tables is not applicable`, () => {
  const html = page('<table><caption>Prices</caption><tr><th>Item</th></tr></table>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable');
  // A role other than presentation or none does not make a layout table.
  assertRule(
    runa11yCoreOnHtml(page(layout('<caption>c</caption>', 'role="grid"')), RUN),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: each kind of data table markup fails and is named`, () => {
  const cases = [
    ['<caption>c</caption>', 'caption'],
    ['<tr><th>h</th></tr>', 'th'],
    ['<thead><tr><td>h</td></tr></thead>', 'thead'],
    ['<tfoot><tr><td>f</td></tr></tfoot>', 'tfoot'],
    ['<colgroup><col></colgroup>', 'colgroup'],
    ['<tr><td role="rowheader">h</td></tr>', 'role="rowheader"'],
    ['<tr><td role="columnheader">h</td></tr>', 'role="columnheader"'],
    ['<tr><td scope="row">h</td></tr>', 'scope'],
    ['<tr><td headers="x">h</td></tr>', 'headers'],
    ['<tr><td axis="x">h</td></tr>', 'axis']
  ];
  for (const [inner, name] of cases) {
    const rule = assertRule(runa11yCoreOnHtml(page(layout(inner)), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'dataMarkupInLayoutTable', inner);
    assert.ok(
      occ.data.details.markup.join(', ').includes(name),
      `${inner}: ${occ.data.details.markup}`
    );
  }
});

test(`${RULE_ID}: a non-empty summary fails, an empty one does not`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(layout('', 'role="presentation" summary="Layout"')), RUN),
    RULE_ID,
    'fail'
  );
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details.markup, ['summary']);
  assert.equal(occ.i18n.summaryKey, 'layoutTableNoDataMarkup_summary_fail');
  assert.deepEqual(occ.i18n.params, { markup: 'summary' });
  assert.equal(occ.summary, 'This layout table uses data table markup: summary.');
  assertRule(
    runa11yCoreOnHtml(page(layout('', 'role="presentation" summary="  "')), RUN),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: several kinds on one table give one occurrence listing them all`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(layout('<caption>c</caption><tr><th>h</th></tr>')), RUN),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const markup = rule.occurrences[0].data.details.markup;
  assert.ok(markup.includes('caption') && markup.includes('th'), String(markup));
});

test(`${RULE_ID}: a data table nested in a layout table is left alone`, () => {
  const inner = '<table><caption>Prices</caption><tr><th scope="col">Item</th></tr></table>';
  const html = page(`<table role="presentation"><tr><td>${inner}</td></tr></table>`);
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(layout('<caption>c</caption>')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/layout-table-no-data-markup-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'layout-table-no-data-markup-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });
  const ids = (tier) =>
    rule.occurrences
      .filter((o) => o.occurrenceOutcome === tier)
      .map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids('fail'), [
    'ltn_case_01',
    'ltn_case_02',
    'ltn_case_03',
    'ltn_case_04',
    'ltn_case_05',
    'ltn_case_10'
  ]);
  assert.deepEqual(ids('cantTell'), ['ltn_case_11']);
});

// RGAA 5.8.1 lists <colgroup> with the other data table markup.
test(`${RULE_ID}: <colgroup> in a layout table fails`, () => {
  const html = page(
    '<table role="presentation"><colgroup><col></colgroup><tr><td>a</td><td>b</td></tr></table>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(rule.occurrences[0].data.details.markup, ['colgroup']);
});

// 5.8.1 applies to layout tables. A table with a full header row or column
// over a grid of data may be a data table given the wrong role, which is a
// different defect, so the rule asks.
const DATA_LIKE =
  '<table role="presentation"><tr><th>Item</th><th>Price</th></tr><tr><td>Tea</td><td>2</td></tr><tr><td>Milk</td><td>1</td></tr></table>';

test(`${RULE_ID}: a data-like table marked as layout is asked about, not failed`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(DATA_LIKE), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'dataLikeTableMarkedLayout');
  assert.deepEqual(occ.data.details.markup, ['th']);
  assert.equal(occ.uncertainty.code, 'judgement-required');
  // A header column counts the same way.
  const column = page(
    '<table role="none"><tr><th>Tea</th><td>2</td></tr><tr><th>Milk</th><td>1</td></tr></table>'
  );
  assertRule(runa11yCoreOnHtml(column, RUN), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: a layout table with one stray header cell still fails`, () => {
  for (const body of [
    '<table role="presentation"><tr><th>Left</th><td>Right</td></tr></table>',
    '<table role="presentation"><tr><th>Menu</th><td>Content</td></tr><tr><td>a</td><td>b</td></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail');
  }
});

test(`${RULE_ID}: under the rgaa-4.1.2 profile, colgroup fails and a data-like table is asked about (5.8.1)`, () => {
  const run = (body) => runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const failed = assertRule(
    run('<table role="presentation"><colgroup><col></colgroup><tr><td>a</td></tr></table>'),
    RULE_ID,
    'fail'
  );
  const tests = failed.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement);
  assert.deepEqual(tests, ['5.8.1']);
  assertRule(run(DATA_LIKE), RULE_ID, 'cantTell');
  // Opt-in: a WCAG profile does not run it.
  const wcag = runa11yCoreOnHtml(page(DATA_LIKE), { engineOptions: { profile: 'wcag22-aa' } });
  assert.ok(!wcag.checksResults.some((r) => r.ruleId === RULE_ID));
});
