'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'frame-title-not-empty';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a non-empty title passes`, () => {
  const html = page('<iframe src="a.html" title="Carte"></iframe>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: an empty or whitespace title fails, whatever the aria-label`, () => {
  for (const body of [
    '<iframe src="a.html" title=""></iframe>',
    '<iframe src="a.html" title="  \t"></iframe>',
    '<iframe src="a.html" title="" aria-label="Map"></iframe>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'emptyTitle');
    assert.equal(occ.i18n.summaryKey, 'frameTitleNotEmpty_summary_fail');
    assert.equal(occ.summary, 'This <iframe> has an empty title attribute.');
  }
});

// 2.2.1 covers frames « ayant un attribut title »; a missing one is 2.1.1's.
test(`${RULE_ID}: a frame with no title attribute is not applicable`, () => {
  for (const body of [
    '<iframe src="a.html"></iframe>',
    '<iframe src="a.html" title="" aria-hidden="true"></iframe>',
    '<div aria-hidden="true"><iframe src="a.html" title=""></iframe></div>',
    '<p>No frame</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<iframe src="a.html" title=""></iframe>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(rule.occurrences[0].summary, 'Ce cadre <iframe> a un attribut title vide.');
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<iframe src="a.html" title=""></iframe>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 2.2 rollup id run it`, () => {
  const html = page('<iframe src="a.html" title=""></iframe>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-2.2' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// iframe-name-present passes a frame named by aria-label whatever its title;
// RGAA 2.2.1 judges the title alone.
test(`${RULE_ID}: RGAA 2.2 fails an empty title that WCAG 4.1.2 passes in the same run`, () => {
  const result = runa11yCoreOnHtml(
    page('<iframe src="a.html" title="" aria-label="Map"></iframe>'),
    RGAA
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-2.2').outcome, 'fail');
  assert.equal(rollup(result, 'rgaa-4.1.2-2.1').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-4.1.2-name').outcome, 'pass');
});

test(`${RULE_ID}: RGAA 2.2 and WCAG 4.1.2 agree on an empty title with no other name`, () => {
  const result = runa11yCoreOnHtml(page('<iframe src="a.html" title=""></iframe>'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-2.2').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-name').outcome, 'fail');
});

// identical-iframes-same-purpose no longer reports 2.2.1: it groups frames by
// accessible name, which may come from aria-label.
test(`${RULE_ID}: two frames sharing only an aria-label do not fail RGAA 2.2`, () => {
  const html = page(
    '<iframe src="https://a.example/one" title="Weather" aria-label="Ad"></iframe>' +
      '<iframe src="https://b.example/two" title="Traffic" aria-label="Ad"></iframe>'
  );
  const result = runa11yCoreOnHtml(html, RGAA);
  const identical = result.checksResults.find((r) => r.ruleId === 'identical-iframes-same-purpose');
  assert.ok(identical && identical.outcome !== 'pass' && identical.outcome !== 'notApplicable');
  assert.ok(
    !rollup(result, 'rgaa-4.1.2-2.2').data.details.checksIds.includes(
      'identical-iframes-same-purpose'
    )
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-2.2').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['ftn_case_01', 'ftn_case_02']);
});
