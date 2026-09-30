'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'listbox-option-groups-absent';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const GROUPED =
  '<div role="listbox" aria-label="Ville" tabindex="0"><div role="group" aria-label="France">' +
  '<div role="option" aria-selected="false">Paris</div></div></div>';
const FLAT =
  '<div role="listbox" aria-label="Ville" tabindex="0">' +
  '<div role="option" aria-selected="false">Paris</div></div>';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a listbox of options only passes`, () => {
  assertRule(runa11yCoreOnHtml(page(FLAT), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a listbox that contains role="group" fails`, () => {
  for (const body of [
    GROUPED,
    '<ul role="listbox" aria-label="F" tabindex="0"><li role="presentation">' +
      '<ul role="group" aria-label="Citrus"><li role="option" aria-selected="false">Lemon</li></ul>' +
      '</li></ul>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'ariaOptionGroups');
    assert.equal(occ.data.details.groupCount, 1);
    assert.equal(occ.i18n.summaryKey, 'listboxOptionGroupsAbsent_summary_fail');
    assert.equal(occ.summary, 'This listbox groups its options with role="group".');
  }
});

test(`${RULE_ID}: a native select, or no listbox, is not applicable`, () => {
  for (const body of [
    '<select aria-label="x"><optgroup label="E"><option>a</option></optgroup></select>',
    '<select role="listbox" multiple aria-label="x"><optgroup label="E"><option>a</option></optgroup></select>',
    '<div role="group" aria-label="g"><button>a</button></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(GROUPED), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette liste role="listbox" regroupe ses options avec role="group".'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(GROUPED), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 11.8 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.8' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page(GROUPED), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// WAI-ARIA allows role="group" in a listbox; RGAA 11.8's technical note does
// not accept ARIA option groups.
test(`${RULE_ID}: RGAA 11.8 fails grouped ARIA options that WCAG 1.3.1 and 4.1.2 pass in the same run`, () => {
  const result = runa11yCoreOnHtml(page(GROUPED), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-11.8').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-4.1.2-name').outcome, 'pass');
});

test(`${RULE_ID}: RGAA 11.8 and WCAG 1.3.1 agree on a listbox without groups`, () => {
  const result = runa11yCoreOnHtml(page(FLAT), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-11.8').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'listbox-option-groups-absent-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lbog_case_01', 'lbog_case_02']);
});
