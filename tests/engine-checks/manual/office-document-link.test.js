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
    '<a href="/report.html">Report</a><a href="/pdf/">Documents</a><a href="?file=a.pdf">Query only</a><a>No href</a>';
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['odl_case_01', 'odl_case_02', 'odl_case_03']);
});
