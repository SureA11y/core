'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'role-img-aria-name';
const WCAG_RULE = 'role-img-text-alternative-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.1';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);

test(`${RULE_ID}: a role="img" named by aria-label or aria-labelledby passes`, () => {
  for (const body of [
    '<div role="img" aria-label="Graphique"></div>',
    '<p id="l">Note : 4 sur 5</p><div role="img" aria-labelledby="l">★★★★</div>',
    '<div role="img" aria-labelledby="missing" aria-label="Graphique"></div>',
    '<span role="img" aria-label="Note" title="Note : 3 sur 5">★★★</span>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a title-only name fails with reasonCode titleOnly`, () => {
  for (const body of [
    '<div role="img" title="Graphique"></div>',
    '<div role="img" aria-labelledby="missing" title="Carte"></div>',
    '<div role="img" aria-label=" " title="Carte"></div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'titleOnly', body);
    assert.equal(occ.i18n.summaryKey, 'roleImgAriaName_summary_fail_titleOnly');
    assert.deepEqual(occ.i18n.params, { element: 'div' });
  }
});

test(`${RULE_ID}: no name at all fails with reasonCode missingAlternative`, () => {
  const rule = assertRule(run('<span role="img">★★★</span>'), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'missingAlternative');
  assert.equal(rule.occurrences[0].summary, 'This <span> with role="img" has no text alternative.');
});

test(`${RULE_ID}: an SVG element named only by a <title> child is asked about (RGAA contradicts itself)`, () => {
  const html = '<svg width="20" height="20"><g role="img"><title>Camembert</title></g></svg>';
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'svgTitleOnly');
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'roleImgAriaName_summary_cantTell_svgTitle');
});

test(`${RULE_ID}: a failure and a question on the same page give fail with both occurrences`, () => {
  const html =
    '<div role="img" title="x"></div><svg><g role="img"><title>Camembert</title></g></svg>';
  const rule = assertRule(run(html), RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(
    rule.occurrences.map((o) => o.occurrenceOutcome),
    ['fail', 'cantTell']
  );
});

test(`${RULE_ID}: <img>, an outer <svg>, graphics-* roles and aria-hidden are not applicable`, () => {
  for (const body of [
    '<img role="img" src="a.png" title="x">',
    '<svg role="img" width="10" height="10"></svg>',
    '<svg><circle role="graphics-symbol" r="4"/></svg>',
    '<span role="img" aria-hidden="true">★</span>',
    '<div aria-hidden="true"><span role="img">★</span></div>',
    '<div hidden><span role="img">★</span></div>',
    '<p>No image</p>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page('<div role="img" title="Graphique"></div>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
  const byTag = runa11yCoreOnHtml(html, { engineOptions: { tags: { include: 'rgaa' } } });
  assert.ok(byTag.checksResults.some((r) => r.ruleId === RULE_ID));
});

// Under the RGAA profile, the 1.1 rollup takes this rule's verdict, while the
// WCAG 1.1.1 rollup in the same run keeps what a WCAG run reports.
function verdicts(body) {
  const html = page(body);
  const rgaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  const rollup = (r, id) => (r.rulesResults.find((x) => x.ruleId === id) || {}).outcome;
  const check = (r, id) => (r.checksResults.find((x) => x.ruleId === id) || {}).outcome;
  assert.equal(rollup(rgaa, WCAG_ROLLUP), rollup(wcag, WCAG_ROLLUP), body);
  assert.equal(check(rgaa, WCAG_RULE), check(wcag, WCAG_RULE), body);
  const wcagRule = rgaa.checksResults.find((x) => x.ruleId === WCAG_RULE);
  assert.ok(!wcagRule || !wcagRule.rollupIds.includes(RGAA_ROLLUP), 'unlinked from 1.1.1');
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(wcag, WCAG_RULE),
    wcag: rollup(wcag, WCAG_ROLLUP)
  };
}

test(`${RULE_ID}: RGAA profile, a title-only name: WCAG passes, RGAA 1.1 fails`, () => {
  assert.deepEqual(verdicts('<div role="img" title="Graphique"></div>'), {
    rule: 'fail',
    rgaa: 'fail',
    wcagRule: 'pass',
    wcag: 'pass'
  });
});

test(`${RULE_ID}: RGAA profile, a graphics-symbol with no name: WCAG fails, RGAA 1.1 does not`, () => {
  const v = verdicts('<svg><circle role="graphics-symbol" r="4"/></svg>');
  assert.equal(v.wcagRule, 'fail');
  assert.equal(v.wcag, 'fail');
  assert.equal(v.rule, 'notApplicable');
  assert.notEqual(v.rgaa, 'fail');
});

test(`${RULE_ID}: RGAA profile, the two standards agree on no name and on aria-label`, () => {
  assert.deepEqual(verdicts('<div role="img"></div>'), {
    rule: 'fail',
    rgaa: 'fail',
    wcagRule: 'fail',
    wcag: 'fail'
  });
  assert.deepEqual(verdicts('<div role="img" aria-label="Graphique"></div>'), {
    rule: 'pass',
    rgaa: 'pass',
    wcagRule: 'pass',
    wcag: 'pass'
  });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/role-img-aria-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['rian_case_01', 'fail'],
      ['rian_case_02', 'fail'],
      ['rian_case_03', 'fail'],
      ['rian_case_04', 'cantTell']
    ]
  );
});
