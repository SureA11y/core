'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'th-scope-row-col';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const GROUP_TABLE =
  '<table><tr><td></td><th scope="colgroup" colspan="2">2025</th></tr>' +
  '<tr><td></td><th scope="col">Q1</th><th scope="col">Q2</th></tr>' +
  '<tr><th scope="row">North</th><td>1</td><td>2</td></tr></table>';
const COL_TABLE =
  '<table><tr><th scope="col">Name</th><th scope="col">Age</th></tr><tr><td>Ada</td><td>36</td></tr></table>';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: scope="colgroup" or "rowgroup" on a <th> is asked about`, () => {
  for (const [scope, expected] of [
    ['colgroup', 'colgroup'],
    ['rowgroup', 'rowgroup'],
    ['ColGroup', 'colgroup'],
    [' rowgroup ', 'rowgroup']
  ]) {
    const body = `<table><tr><th scope="${scope}">G</th></tr><tr><td>1</td></tr></table>`;
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'groupScope');
    assert.equal(occ.data.details.scope, expected);
    assert.equal(occ.i18n.summaryKey, 'thScopeRowCol_summary_cantTell');
    assert.equal(occ.summary, `This header has scope="${expected}".`);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: row or col scopes, other elements and layout tables are not applicable`, () => {
  for (const body of [
    COL_TABLE,
    '<table><tr><th scope="row">A</th><td>1</td></tr></table>',
    '<table><tr><th>A</th></tr><tr><td>1</td></tr></table>',
    '<table><tr><td scope="colgroup">A</td></tr></table>',
    '<table role="presentation"><tr><th scope="colgroup">A</th></tr></table>',
    '<table role="none"><tr><th scope="rowgroup">A</th></tr></table>',
    '<table><tr><th scope="column">A</th></tr></table>',
    '<p>No table</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(GROUP_TABLE), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].summary, 'Cet en-tête a un attribut scope="colgroup".');
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(GROUP_TABLE), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 5.7 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-5.7' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page(GROUP_TABLE), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

test(`${RULE_ID}: occurrences carry RGAA 5.7.2 and 5.7.3`, () => {
  const rule = runa11yCoreOnHtml(page(GROUP_TABLE), RGAA).checksResults.find(
    (r) => r.ruleId === RULE_ID
  );
  assert.deepEqual(
    rule.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['5.7.2', '5.7.3']
  );
});

// WCAG technique H63 accepts colgroup and rowgroup; RGAA 5.7 accepts only row
// and col on a header over a whole row or column, and no scope otherwise.
test(`${RULE_ID}: RGAA 5.7 asks about a group scope that WCAG 1.3.1 passes in the same run`, () => {
  const result = runa11yCoreOnHtml(page(GROUP_TABLE), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-5.7').outcome, 'cantTell');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

test(`${RULE_ID}: RGAA 5.7 and WCAG 1.3.1 find nothing wrong with scope="col"`, () => {
  const result = runa11yCoreOnHtml(page(COL_TABLE), RGAA);
  assert.ok(['pass', 'notApplicable'].includes(rollup(result, 'rgaa-4.1.2-5.7').outcome));
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'th-scope-row-col-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['tsrc_case_01', 'tsrc_case_02']);
});
