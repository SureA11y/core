'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'office-document-link';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const FLAGGED = '<a href="/files/report.pdf">Annual report</a>';

test(`${RULE_ID}: a link to a PDF is flagged with its extension`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, { reasonCode: 'officeDocument', extension: 'pdf' });
  assert.deepEqual(occ.i18n.params, { extension: 'pdf' });
  assert.equal(occ.summary, 'This link downloads a .pdf document.');
});

test(`${RULE_ID}: every listed extension is caught, in any case, with a query or fragment`, () => {
  const exts = [
    'pdf',
    'doc',
    'docx',
    'odt',
    'rtf',
    'xls',
    'xlsx',
    'ods',
    'ppt',
    'pptx',
    'odp',
    'epub'
  ];
  const body = exts.map((e, i) => `<a href="f${i}.${e.toUpperCase()}?x=1#p">${e}</a>`).join(' ');
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: exts.length,
    maxOccurrences: exts.length
  });
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.extension),
    exts
  );
});

test(`${RULE_ID}: image map areas count as links`, () => {
  const body =
    '<map name="m"><area href="x.odt" alt="Form" shape="rect" coords="0,0,1,1"></map><img usemap="#m" src="m.png" alt="Map">';
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: other links are not flagged`, () => {
  const body =
    '<a href="/report.html">Report</a><a href="/pdf/">Documents</a><a href="/data/prices.csv">CSV</a><a href="?q=pdf">Search</a><a>No href</a>';
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
});

function extensionsOf(rule) {
  return rule.occurrences.map((o) => o.data.details.extension);
}

test(`${RULE_ID}: a document named in the query string is flagged`, () => {
  const body =
    '<a href="/get?file=rapport.pdf">Rapport</a><a href="/open?id=4&amp;url=%2Fdocs%2Fbudget.xlsx%3Fv%3D2">Budget</a>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(extensionsOf(rule), ['pdf', 'xlsx']);
});

test(`${RULE_ID}: the download attribute's filename is read first`, () => {
  const body =
    '<a href="/dl/1" download="r.docx">Report</a><a href="/files/a.pdf" download="a.odt">Form</a><a href="/files/b.pdf" download>Other</a>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(extensionsOf(rule), ['docx', 'odt', 'pdf']);
});

test(`${RULE_ID}: a form or submit button that downloads a document is flagged`, () => {
  const body =
    '<form id="f" action="/r.pdf"><button>Télécharger</button></form>' +
    '<form action="/search"><button id="b" formaction="/export?format=x&amp;name=list.ods">Export</button><button type="button" formaction="/x.pdf">Not a submit</button></form>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(extensionsOf(rule), ['pdf', 'ods']);
  assert.ok(rule.occurrences[0].html.includes('id="f"'));
  assert.ok(rule.occurrences[1].html.includes('id="b"'));
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'officeDocumentLink_summary_cantTell_form');
  assert.equal(rule.occurrences[0].summary, 'This form downloads a .pdf document.');
});

test(`${RULE_ID}: macro-enabled, template and OpenDocument drawing extensions are caught`, () => {
  const exts = ['docm', 'dotx', 'xlsm', 'xltx', 'pptm', 'ppsx', 'potx', 'odg', 'ott', 'ots', 'otp'];
  const body = exts.map((e, i) => `<a href="f${i}.${e}">${e}</a>`).join(' ');
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: exts.length,
    maxOccurrences: exts.length
  });
  assert.deepEqual(extensionsOf(rule), exts);
});

test(`${RULE_ID}: the RGAA profile runs it and a query-string PDF is asked about under 13.3.1`, () => {
  const result = runa11yCoreOnHtml(page('<a href="/get?file=rapport.pdf">Rapport</a>'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.equal(rule.outcome, 'cantTell');
  const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-13.3');
  assert.ok(rollup, 'the 13.3 rollup is reported');
  assert.equal(rollup.outcome, 'cantTell');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/office-document-link-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'office-document-link-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'odl_case_01',
    'odl_case_02',
    'odl_case_03',
    'odl_case_06',
    'odl_case_07',
    'odl_case_08',
    'odl_case_09'
  ]);
});
