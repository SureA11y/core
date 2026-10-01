'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'optgroup-label-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

function select(groups) {
  return `<select aria-label="Choice">${groups}</select>`;
}

test(`${RULE_ID}: notApplicable without an optgroup in a select`, () => {
  assertRule(runa11yCoreOnHtml(page(select('<option>a</option>')), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: a labelled optgroup passes`, () => {
  const html = page(select('<optgroup label="Fruit"><option>Apple</option></optgroup>'));
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a missing label fails`, () => {
  const html = page(select('<optgroup><option>Apple</option></optgroup>'));
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'missingLabel');
  assert.equal(occ.i18n.summaryKey, 'optgroupLabelPresent_summary_fail_missing');
});

// RGAA 11.8.2 only asks whether the attribute exists; an empty label is a
// relevance question for 11.8.3.
test(`${RULE_ID}: an empty or whitespace-only label attribute passes`, () => {
  for (const label of ['', '   ']) {
    const html = page(select(`<optgroup label="${label}"><option>Apple</option></optgroup>`));
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
    assertRule(
      runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }),
      RULE_ID,
      'pass',
      { maxOccurrences: 0 }
    );
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(select('<optgroup><option>a</option></optgroup>')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/optgroup-label-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'optgroup-label-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['ogl_case_02']);
});
