'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'complex-table-summary-quality';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

const HTML5 = '<!doctype html>';
const HTML401 =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';

function page(body, doctype = HTML5) {
  return `${doctype}<html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const TWO_HEADER_ROWS =
  '<tr><td></td><th colspan="2">2025</th></tr><tr><td></td><th>Q1</th><th>Q2</th></tr><tr><th>North</th><td>1</td><td>2</td></tr>';
const SIMPLE_ROWS = '<tr><th>Day</th><th>Hours</th></tr><tr><td>Monday</td><td>9-17</td></tr>';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a complex table with a caption is asked about`, () => {
  const body = `<table><caption>Sales by year and quarter</caption>${TWO_HEADER_ROWS}</table>`;
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'complexTableSummary',
    sources: ['caption'],
    doctype: 'html5'
  });
  assert.equal(occ.i18n.summaryKey, 'complexTableSummaryQuality_summary_cantTell');
  assert.equal(
    occ.summary,
    'This table looks like a complex data table and has a summary. Check that it explains how the table is organised.'
  );
  assert.equal(occ.uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: aria-describedby pointing to text is a summary, on a <table> or role="table"`, () => {
  const native = `<p id="d">Years, then quarters.</p><table aria-describedby="d">${TWO_HEADER_ROWS}</table>`;
  const aria =
    '<p id="d">Years, then quarters.</p><div role="table" aria-label="Sales" aria-describedby="d">' +
    '<div role="row"><span role="cell"></span><span role="columnheader">2025</span></div>' +
    '<div role="row"><span role="cell"></span><span role="columnheader">Q1</span></div>' +
    '<div role="row"><span role="rowheader">North</span><span role="cell">1</span></div></div>';
  for (const body of [native, aria]) {
    const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    }).occurrences[0];
    assert.deepEqual(occ.data.details.sources, ['aria-describedby']);
  }
});

// 5.1.1 step 2 accepts summary only « dans les versions de HTML et de XHTML
// antérieures à HTML 5 ».
test(`${RULE_ID}: the summary attribute is a summary only before HTML5`, () => {
  const body = `<table summary="Years head groups of quarters">${TWO_HEADER_ROWS}</table>`;
  const html4 = assertRule(runa11yCoreOnHtml(page(body, HTML401), RUN), RULE_ID, 'cantTell');
  assert.deepEqual(html4.occurrences[0].data.details.sources, ['summary']);
  assert.equal(html4.occurrences[0].data.details.doctype, 'html4');
  const none = assertRule(runa11yCoreOnHtml(page(body, ''), RUN), RULE_ID, 'cantTell');
  assert.equal(none.occurrences[0].data.details.doctype, 'none');
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: simple tables, tables without a summary and layout tables are not applicable`, () => {
  for (const body of [
    `<table><caption>Opening hours</caption>${SIMPLE_ROWS}</table>`,
    `<table summary="Hours"><caption>Hours</caption>${SIMPLE_ROWS}</table>`,
    `<table>${TWO_HEADER_ROWS}</table>`,
    `<table aria-describedby="missing">${TWO_HEADER_ROWS}</table>`,
    `<p id="e"> </p><table aria-describedby="e">${TWO_HEADER_ROWS}</table>`,
    `<table><caption>  </caption>${TWO_HEADER_ROWS}</table>`,
    `<table role="presentation"><caption>Layout</caption>${TWO_HEADER_ROWS}</table>`,
    '<p>No table</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const body = `<table><caption>Sales</caption>${TWO_HEADER_ROWS}</table>`;
  const rule = assertRule(
    runa11yCoreOnHtml(page(body), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce tableau semble être un tableau de données complexe et a un résumé. Vérifiez qu’il explique comment le tableau est organisé.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page(`<table><caption>Sales</caption>${TWO_HEADER_ROWS}</table>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 5.2 rollup id run it`, () => {
  const html = page(`<table><caption>Sales</caption>${TWO_HEADER_ROWS}</table>`);
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-5.2' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// WCAG does not ask for a table summary; RGAA 5.2.1 asks whether a complex
// table's summary is relevant.
test(`${RULE_ID}: RGAA 5.2 asks about a complex table's caption that WCAG 1.3.1 passes in the same run`, () => {
  const result = runa11yCoreOnHtml(
    page(`<table><caption>Sales</caption>${TWO_HEADER_ROWS}</table>`),
    RGAA
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-5.2').outcome, 'cantTell');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

// table-duplicate-name keeps asking about a caption repeated in summary, but
// no longer under 5.2.1: in HTML5 summary is not a summary, and a simple table
// is outside 5.2 (M42).
test(`${RULE_ID}: a simple HTML5 table whose summary repeats the caption leaves RGAA 5.2`, () => {
  const body = `<table summary="Hours"><caption>Hours</caption>${SIMPLE_ROWS}</table>`;
  const wcag = runa11yCoreOnHtml(page(body));
  assert.equal(
    wcag.checksResults.find((r) => r.ruleId === 'table-duplicate-name').outcome,
    'cantTell'
  );
  const rgaa = runa11yCoreOnHtml(page(body), RGAA);
  assert.ok(!rgaa.checksResults.some((r) => r.ruleId === 'table-duplicate-name'));
  assert.equal(rollup(rgaa, 'rgaa-4.1.2-5.2').outcome, 'notApplicable');
  assert.equal(rollup(rgaa, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

test(`${RULE_ID}: before HTML5, both ask about a complex table whose summary repeats the caption`, () => {
  const body = `<table summary="Sales"><caption>Sales</caption>${TWO_HEADER_ROWS}</table>`;
  const wcag = runa11yCoreOnHtml(page(body, HTML401));
  assert.equal(
    wcag.checksResults.find((r) => r.ruleId === 'table-duplicate-name').outcome,
    'cantTell'
  );
  const rgaa = runa11yCoreOnHtml(page(body, HTML401), RGAA);
  assert.equal(rollup(rgaa, 'rgaa-4.1.2-5.2').outcome, 'cantTell');
  assert.deepEqual(
    rgaa.checksResults.find((r) => r.ruleId === RULE_ID).occurrences[0].data.details.sources,
    ['caption', 'summary']
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'complex-table-summary-quality-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['ctsq_case_01', 'ctsq_case_02', 'ctsq_case_03']);
});
