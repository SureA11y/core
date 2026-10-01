'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'fake-list';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const FLAGGED = '<p>• Apples<br>• Pears<br>• Plums</p>';

const flagged = (body) =>
  runa11yCoreOnHtml(page(body), RUN).checksResults.find((r) => r.ruleId === RULE_ID);

test(`${RULE_ID}: lines split by <br> starting with the same bullet are flagged as an unordered list`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, { reasonCode: 'unorderedListAsText', items: 3 });
  assert.equal(occ.i18n.summaryKey, 'fakeList_summary_cantTell_unordered');
  assert.equal(
    occ.summary,
    'These 3 lines start with the same bullet but are not marked up as a list.'
  );
});

test(`${RULE_ID}: paragraphs with consecutive numbers are flagged as an ordered list, from the first`, () => {
  const body = '<p>Intro</p><p id="first">1) Mix</p><p>2) Bake</p><div>3) Serve</div><p>After</p>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /id="first"/);
  assert.deepEqual(occ.data.details, { reasonCode: 'orderedListAsText', items: 3 });
  assert.equal(occ.i18n.hintKey, 'fakeList_hint_cantTell_ordered');
});

test(`${RULE_ID}: several runs are reported in page order`, () => {
  const body = '<p id="a">1. One</p><p>2. Two</p><h2>Next</h2><div id="b">- x<br>- y</div>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(
    rule.occurrences.map((o) => o.html.match(/id="([^"]+)"/)[1]),
    ['a', 'b']
  );
});

test(`${RULE_ID}: mixed bullets, broken numbering, a single line and real lists are not flagged`, () => {
  for (const body of [
    '<p>• a<br>- b</p>',
    '<p>1. Mix<br>3. Bake</p>',
    '<p>2024. A year</p><p>2026. Another</p>',
    '<p>• Only one</p>',
    '<p>-5 degrees<br>-3 degrees</p>',
    '<ul><li>• a<br>• b</li></ul>',
    '<div role="list"><p>- a</p><p>- b</p></div>',
    '<pre>- a\n- b</pre>'
  ]) {
    assert.equal(flagged(body).outcome, 'notApplicable', body);
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/fake-list-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'fake-list-all-scenarios.html');
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['fkl_case_01', 'fkl_case_02', 'fkl_case_03']);
});
