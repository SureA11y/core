'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-list-item-roles';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const LI_LIST = '<div role="list"><li>a</li><li>b</li></div>';
const ARIA_LIST = '<div role="list"><div role="listitem">a</div><div role="listitem">b</div></div>';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a role="list" whose children all have role="listitem" passes`, () => {
  for (const body of [
    ARIA_LIST,
    '<section role="list"><p role="listitem">a</p><template><p>x</p></template></section>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: <li> items without role="listitem" are asked about`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(LI_LIST), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'liWithoutListitemRole');
  assert.equal(occ.data.details.itemsWithoutListitemRole, 2);
  assert.equal(occ.i18n.summaryKey, 'ariaListItemRoles_summary_cantTell_li');
  assert.equal(occ.summary, 'This role="list" holds <li> elements without role="listitem".');
  assert.equal(occ.uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: other children without role="listitem" are asked about`, () => {
  for (const body of [
    '<div role="list"><div>a</div><div>b</div></div>',
    '<div role="list"><div role="listitem">a</div><span>b</span></div>',
    '<div role="list"><li role="presentation">a</li></div>',
    '<menu role="list"><li role="none">a</li><div>b</div></menu>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'childWithoutListitemRole', body);
    assert.equal(occ.i18n.summaryKey, 'ariaListItemRoles_summary_cantTell_other');
  }
});

test(`${RULE_ID}: HTML lists, empty lists and pages without role="list" are not applicable`, () => {
  for (const body of [
    '<ul role="list"><li>a</li></ul>',
    '<ol role="list"><li>a</li><div>b</div></ol>',
    '<div role="list">text only</div>',
    '<div role="list"><script>1</script></div>',
    '<ul><li>a</li></ul>',
    '<div role="listbox" aria-label="x"><div role="option" aria-selected="false">a</div></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(LI_LIST), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cet élément role="list" contient des balises <li> sans role="listitem".'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(LI_LIST), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 9.3 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-9.3' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page(LI_LIST), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// aria-required-children passes a role="list" with at least one listitem;
// RGAA 9.3 wants every item built with role="listitem".
test(`${RULE_ID}: RGAA 9.3 asks about a list that WCAG 1.3.1 passes in the same run`, () => {
  const result = runa11yCoreOnHtml(
    page('<div role="list"><div role="listitem">a</div><div>b</div></div>'),
    RGAA
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-9.3').outcome, 'cantTell');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

// The 9.3 technical note: tablist, menu, listbox, tree and combobox are not
// lists, so the ARIA container rules no longer report under 9.3 (M20), while
// their WCAG 1.3.1 verdict stays.
test(`${RULE_ID}: widget findings of the ARIA container rules stay under WCAG 1.3.1 but leave RGAA 9.3`, () => {
  const empty = runa11yCoreOnHtml(page('<div role="tablist" aria-label="t"></div>'), RGAA);
  assert.equal(
    empty.checksResults.find((r) => r.ruleId === 'aria-required-children').outcome,
    'cantTell'
  );
  assert.equal(rollup(empty, 'wcag-1.3.1-info-and-relationships').outcome, 'cantTell');
  assert.equal(rollup(empty, 'rgaa-4.1.2-9.3').outcome, 'notApplicable');

  const orphan = runa11yCoreOnHtml(page('<div role="option" aria-selected="false">a</div>'), RGAA);
  assert.equal(
    orphan.checksResults.find((r) => r.ruleId === 'aria-required-parent').outcome,
    'fail'
  );
  assert.equal(rollup(orphan, 'wcag-1.3.1-info-and-relationships').outcome, 'fail');
  assert.notEqual(rollup(orphan, 'rgaa-4.1.2-9.3').outcome, 'fail');

  for (const id of ['aria-required-children', 'aria-required-parent', 'aria-prohibited-children']) {
    assert.ok(!rollup(empty, 'rgaa-4.1.2-9.3').data.details.checksIds.includes(id), id);
  }
});

test(`${RULE_ID}: RGAA 9.3 and WCAG 1.3.1 both ask about <li> items in a role="list"`, () => {
  const result = runa11yCoreOnHtml(page(LI_LIST), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-9.3').outcome, 'cantTell');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'cantTell');
});

test(`${RULE_ID}: RGAA 9.3 and WCAG 1.3.1 agree on a list built with role="listitem"`, () => {
  const result = runa11yCoreOnHtml(page(ARIA_LIST), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-9.3').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-list-item-roles-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['alir_case_01', 'alir_case_02', 'alir_case_03']);
});
