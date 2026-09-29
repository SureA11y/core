'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'ltn_case_01',
    'ltn_case_02',
    'ltn_case_03',
    'ltn_case_04',
    'ltn_case_05'
  ]);
});
