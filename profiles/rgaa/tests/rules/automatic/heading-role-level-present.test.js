'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'heading-role-level-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

test(`${RULE_ID}: role="heading" without aria-level fails`, () => {
  const rule = assertRule(run('<div role="heading">News</div>'), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'missingAriaLevel');
  assert.equal(occ.i18n.summaryKey, 'headingRoleLevelPresent_summary_fail_missing');
  assert.equal(occ.summary, 'This element has role="heading" but no aria-level attribute.');
});

test(`${RULE_ID}: an aria-level that is empty or not a number fails with its own reason`, () => {
  for (const value of ['', 'two', ' ']) {
    const rule = assertRule(
      run(`<div role="heading" aria-level="${value}">News</div>`),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'ariaLevelNotNumber', JSON.stringify(value));
    assert.equal(occ.data.details.ariaLevel, value);
    assert.equal(occ.i18n.summaryKey, 'headingRoleLevelPresent_summary_fail_notNumber');
    assert.deepEqual(occ.i18n.params, { value });
  }
});

// RGAA 9.1.3 asks only for a number ("x" désignant une valeur numérique); a
// value WAI-ARIA rejects is 8.2.1 business.
test(`${RULE_ID}: any numeric aria-level passes`, () => {
  for (const value of ['2', '6', '0', ' 3 ']) {
    assertRule(run(`<div role="heading" aria-level="${value}">News</div>`), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: native headings and other roles are not applicable`, () => {
  assertRule(
    run('<h2>News</h2><h3 role="heading">Events</h3><div role="button" tabindex="0">Go</div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: the first role WAI-ARIA knows decides`, () => {
  assertRule(run('<div role="bogus heading">News</div>'), RULE_ID, 'fail', { minOccurrences: 1 });
  assertRule(run('<div role="heading button">News</div>'), RULE_ID, 'fail', { minOccurrences: 1 });
  assertRule(run('<div role="button heading" tabindex="0">News</div>'), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: an element outside the accessibility tree is not applicable`, () => {
  assertRule(
    run(
      '<div role="heading" style="display:none">A</div><div role="heading" aria-hidden="true">B</div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<main><div role="heading">News</div></main>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 9.1 rollup id run it`, () => {
  const html = page('<main><div role="heading">News</div></main>');
  for (const opts of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-9.1' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

function rgaaRun(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const rollup = (prefix) => result.rulesResults.find((r) => r.ruleId.startsWith(prefix));
  return { result, rollup };
}

// WCAG accepts the ARIA default level of 2; RGAA's definition of a heading
// requires aria-level.
test(`${RULE_ID}: under the RGAA profile, 9.1 fails where WCAG 1.3.1 passes`, () => {
  const { rollup } = rgaaRun('<main><div role="heading">News</div><p>Text.</p></main>');
  const rgaa91 = rollup('rgaa-4.1.2-9.1');
  assert.equal(rgaa91.outcome, 'fail');
  assert.ok(rgaa91.data.details.checksIds.includes(RULE_ID));
  assert.deepEqual(
    rgaa91.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['9.1.3']
  );
  assert.equal(rollup('wcag-1.3.1-').outcome, 'pass');
});

test(`${RULE_ID}: under the RGAA profile, both pass on role="heading" with aria-level`, () => {
  const { result, rollup } = rgaaRun(
    '<main><div role="heading" aria-level="1">News</div><p>Text.</p></main>'
  );
  assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'pass');
  assert.equal(rollup('rgaa-4.1.2-9.1').outcome, 'pass');
  assert.equal(rollup('wcag-1.3.1-').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/heading-role-level-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'heading-role-level-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['hrl_case_01', 'hrl_case_02', 'hrl_case_03']);
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.reasonCode),
    ['missingAriaLevel', 'ariaLevelNotNumber', 'ariaLevelNotNumber']
  );
});
