'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'viewport-zoom-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(content) {
  const meta = content == null ? '' : `<meta name="viewport" content="${content}">`;
  return `<!doctype html><html lang="en"><head><title>t</title>${meta}</head><body><main><p>Text</p></main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: user-scalable=no is asked about, never failed`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('width=device-width, user-scalable=no'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'zoomRestricted',
    reasons: ['user-scalable=no']
  });
  assert.equal(occ.i18n.summaryKey, 'viewportZoomReview_summary_cantTell');
  assert.deepEqual(occ.i18n.params, { reasons: 'user-scalable=no' });
  assert.equal(occ.summary, 'This viewport meta tag limits zoom (user-scalable=no).');
});

test(`${RULE_ID}: a maximum-scale below 2, or one that does not parse, is asked about`, () => {
  for (const [content, reasons] of [
    ['width=device-width, maximum-scale=1', ['maximum-scale=1']],
    ['maximum-scale=1.5; user-scalable=0', ['user-scalable=0', 'maximum-scale=1.5']],
    ['maximum-scale=yes', ['maximum-scale=yes']]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(content), RUN), RULE_ID, 'cantTell');
    assert.deepEqual(rule.occurrences[0].data.details.reasons, reasons, content);
  }
});

test(`${RULE_ID}: a viewport meta that allows 200% zoom is notApplicable`, () => {
  for (const content of [
    'width=device-width',
    'width=device-width, initial-scale=1',
    'user-scalable=yes, maximum-scale=2',
    'maximum-scale=5',
    'maximum-scale=-1',
    'user-scalable=device-width',
    ''
  ]) {
    assertRule(runa11yCoreOnHtml(page(content), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  assertRule(runa11yCoreOnHtml(page(null), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: whole-document, so a scoped scan is notApplicable`, () => {
  const html = page('user-scalable=no');
  const result = runa11yCoreOnHtml(html, { ...RUN, contextSelector: 'main' });
  assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('user-scalable=no'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette balise meta viewport limite le zoom (user-scalable=no).'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('user-scalable=no');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 10.4 rollup id run it`, () => {
  const html = page('user-scalable=no');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-10.4' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// Under the RGAA profile, 10.4 takes this rule's question, while WCAG 1.4.4 in
// the same run keeps meta-viewport-zoom-enabled's failure.
test(`${RULE_ID}: WCAG 1.4.4 fails user-scalable=no while RGAA 10.4 only asks`, () => {
  const result = runa11yCoreOnHtml(page('width=device-width, user-scalable=no'), RGAA);
  assert.equal(rollup(result, 'wcag-1.4.4-resize-text').outcome, 'fail');
  assert.equal(rollup(result, 'rgaa-4.1.2-10.4').outcome, 'cantTell');
  assert.deepEqual(rollup(result, 'rgaa-4.1.2-10.4').data.details.checksIds, [RULE_ID]);
});

test(`${RULE_ID}: WCAG 1.4.4 and RGAA 10.4 agree when zoom is not restricted`, () => {
  const result = runa11yCoreOnHtml(page('width=device-width, maximum-scale=5'), RGAA);
  assert.equal(rollup(result, 'wcag-1.4.4-resize-text').outcome, 'pass');
  const rgaa = rollup(result, 'rgaa-4.1.2-10.4');
  assert.ok(!rgaa || rgaa.outcome !== 'fail');
  const checks = result.checksResults.filter((r) =>
    ['meta-viewport-zoom-enabled', RULE_ID].includes(r.ruleId)
  );
  assert.deepEqual(checks.map((r) => [r.ruleId, r.outcome]).sort(), [
    ['meta-viewport-zoom-enabled', 'pass'],
    [RULE_ID, 'notApplicable']
  ]);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepEqual(rule.occurrences[0].data.details.reasons, ['user-scalable=no']);
});
