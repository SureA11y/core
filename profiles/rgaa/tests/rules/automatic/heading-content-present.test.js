'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'heading-content-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: an empty heading fails`, () => {
  for (const body of [
    '<h2></h2>',
    '<h2>   </h2>',
    '<h3><span></span></h3>',
    '<h2><span style="display:none">Hidden</span></h2>',
    '<h2><span hidden>Hidden</span></h2>',
    '<div role="heading" aria-level="2"></div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'emptyHeading']], body);
  }
  const occ = assertRule(run('<h2></h2>'), RULE_ID, 'fail').occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'headingContentPresent_summary_fail_empty');
  assert.equal(occ.i18n.hintKey, 'headingContentPresent_hint_fail_empty');
});

test(`${RULE_ID}: a heading named only by an attribute is asked about`, () => {
  for (const [body, name] of [
    ['<h2 title="News"></h2>', 'News'],
    ['<h2 aria-label="Events"></h2>', 'Events'],
    ['<h2 aria-labelledby="l"></h2><p id="l">Offers</p>', 'Offers']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'nameOutsideContent', body);
    assert.equal(occ.data.details.name, name);
    assert.equal(occ.i18n.summaryKey, 'headingContentPresent_summary_cantTell_nameOutsideContent');
    assert.deepEqual(occ.i18n.params, { name });
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
  const inner = assertRule(run('<h2><span aria-label="News"></span></h2>'), RULE_ID, 'cantTell');
  assert.equal(inner.occurrences[0].data.details.reasonCode, 'nameOutsideContent');
  assert.equal(
    inner.occurrences[0].i18n.summaryKey,
    'headingContentPresent_summary_cantTell_descendantName'
  );
});

test(`${RULE_ID}: content that gives no text is asked about`, () => {
  for (const body of [
    '<h2><img src="logo.png" alt=""></h2>',
    '<h2><img src="logo.png"></h2>',
    '<h2><span aria-hidden="true">★</span></h2>',
    '<h2><svg aria-hidden="true"><text>A</text></svg><span aria-hidden="true">B</span></h2>',
    '<h2><input type="text" aria-hidden="false"></h2>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'contentNotReadable', body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'headingContentPresent_summary_cantTell_contentNotReadable'
    );
  }
});

test(`${RULE_ID}: text or an image text alternative passes`, () => {
  for (const body of [
    '<h2>Opening hours</h2>',
    '<h2><img src="a.png" alt="News"></h2>',
    '<h2><img src="a.png" title="News"></h2>',
    '<h2><svg role="img" aria-label="News"></svg></h2>',
    '<h2><svg><title>News</title></svg></h2>',
    '<h2><span role="img" aria-label="News">📰</span></h2>',
    '<h2 style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Menu</h2>',
    '<h2 title="Events">Events</h2>',
    '<div role="heading" aria-level="3">News</div>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: only RGAA headings apply`, () => {
  // role="heading" without aria-level is heading-role-level-present's case.
  assertRule(run('<div role="heading"></div><p>Text</p>'), RULE_ID, 'notApplicable');
  assertRule(run('<h2 role="presentation"></h2>'), RULE_ID, 'notApplicable');
  assertRule(
    run('<h2 style="display:none"></h2><h2 aria-hidden="true"></h2>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: an empty heading fails and the questions are kept beside it`, () => {
  const rule = assertRule(run('<h2></h2><h3 title="News"></h3>'), RULE_ID, 'fail');
  assert.deepEqual(reasons(rule), [
    ['fail', 'emptyHeading'],
    ['cantTell', 'nameOutsideContent']
  ]);
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<main><h2></h2></main>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 9.1 rollup id run it`, () => {
  const html = page('<main><h2></h2></main>');
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

function emptyHeadingByDefault(body) {
  return runa11yCoreOnHtml(page(body)).checksResults.find((r) => r.ruleId === 'empty-heading');
}

// empty-heading only asks, and has no WCAG rollup; RGAA fails the heading.
test(`${RULE_ID}: an empty heading fails 9.1 under RGAA; WCAG only asks and its rollups are unchanged`, () => {
  const body = '<main><h1>Title</h1><h2></h2></main>';
  assert.equal(emptyHeadingByDefault(body).outcome, 'cantTell');
  const { result, rollup } = rgaaRun(body);
  const rgaa91 = rollup('rgaa-4.1.2-9.1');
  assert.equal(rgaa91.outcome, 'fail');
  assert.deepEqual(
    rgaa91.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['9.1.2']
  );
  // empty-heading no longer carries 9.1.2, so the RGAA profile does not run it.
  assert.ok(!rgaa91.data.details.checksIds.includes('empty-heading'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === 'empty-heading'));
  const wcag = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'wcag22-aa' } });
  for (const prefix of ['wcag-1.3.1-', 'wcag-2.4.6-']) {
    const inWcagRun = wcag.rulesResults.find((r) => r.ruleId.startsWith(prefix));
    assert.equal(rollup(prefix).outcome, inWcagRun.outcome, prefix);
  }
});

// A title-only heading: WCAG sees a name; RGAA asks about the content.
test(`${RULE_ID}: a title-only heading is asked about under RGAA; WCAG sees a name`, () => {
  const body = '<main><h1>Title</h1><h2 title="News"></h2></main>';
  assert.equal(emptyHeadingByDefault(body).outcome, 'pass');
  const { result } = rgaaRun(body);
  assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'cantTell');
});

test(`${RULE_ID}: both agree on a heading with text`, () => {
  const body = '<main><h1>Title</h1><h2>News</h2></main>';
  assert.equal(emptyHeadingByDefault(body).outcome, 'pass');
  const { result, rollup } = rgaaRun(body);
  assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'pass');
  assert.notEqual(rollup('rgaa-4.1.2-9.1').outcome, 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/heading-content-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'heading-content-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'hcp_case_01',
    'hcp_case_02',
    'hcp_case_03',
    'hcp_case_04',
    'hcp_case_05',
    'hcp_case_06',
    'hcp_case_07'
  ]);
  assert.deepEqual(reasons(rule), [
    ['fail', 'emptyHeading'],
    ['fail', 'emptyHeading'],
    ['fail', 'emptyHeading'],
    ['cantTell', 'nameOutsideContent'],
    ['cantTell', 'nameOutsideContent'],
    ['cantTell', 'contentNotReadable'],
    ['cantTell', 'contentNotReadable']
  ]);
});
