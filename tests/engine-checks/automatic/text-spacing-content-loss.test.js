'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../profiles/rgaa/rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

// jsdom has no layout: only the style sheet reading runs here.
// text-spacing-content-loss-chromium.test.js checks the measured verdicts.
const RULE_ID = 'text-spacing-content-loss';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(css, body) {
  return `<!doctype html><html lang="en"><head><title>t</title><style>body{font-size:16px} ${css}</style></head><body>${body}</body></html>`;
}
const run = (css, body = '<p>Opening hours today</p>', extra = {}) =>
  runa11yCoreOnHtml(page(css, body), { ...RUN, ...extra });

test(`${RULE_ID}: without a layout and no forced spacing, notApplicable and says why`, () => {
  const rule = assertRule(run(''), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  assert.deepEqual(rule.data, { reason: 'noLayout' });
});

test(`${RULE_ID}: a style sheet rule forcing spacing below the metric with !important is asked about`, () => {
  for (const [css, property] of [
    ['p{letter-spacing:0 !important}', 'letter-spacing'],
    ['p{letter-spacing:0.05em !important}', 'letter-spacing'],
    ['p{word-spacing:normal !important}', 'word-spacing'],
    ['p{line-height:1.2 !important}', 'line-height'],
    ['p{line-height:18px !important}', 'line-height'],
    ['@media screen{p{line-height:100% !important}}', 'line-height']
  ]) {
    const rule = assertRule(run(css), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'STYLESHEET_IMPORTANT', css);
    assert.equal(occ.data.details.property, property, css);
    assert.equal(occ.uncertainty.code, 'runtime-dependent');
    assert.equal(
      occ.i18n.summaryKey,
      'textSpacingContentLoss_summary_cantTell_stylesheetImportant'
    );
  }
});

test(`${RULE_ID}: forced values that meet the metric, keywords and rules without !important are left alone`, () => {
  for (const css of [
    'p{letter-spacing:0.12em !important}',
    'p{letter-spacing:2px !important}',
    'p{word-spacing:0.2em !important}',
    'p{line-height:1.5 !important}',
    'p{line-height:24px !important}',
    'p{line-height:inherit !important}',
    'p{letter-spacing:0}'
  ]) {
    assertRule(run(css), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run('p{letter-spacing:0 !important}', undefined, { engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.match(
    rule.occurrences[0].summary,
    /^Une règle de feuille de style \(p\) impose letter-spacing: 0/
  );
});

test(`${RULE_ID}: maps to WCAG 1.4.12 and RGAA 10.12.1, and joins the 1.4.12 rollup`, () => {
  const result = runa11yCoreOnHtml(
    page('p{letter-spacing:0 !important}', '<p>Opening hours today</p>'),
    {
      engineOptions: { profile: 'rgaa-4.1.2' }
    }
  );
  const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.equal(check.outcome, 'cantTell');
  assert.ok(check.rollupIds.includes('wcag-1.4.12-text-spacing'));
  assert.ok(check.rollupIds.includes('rgaa-4.1.2-10.12'));
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['10.12.1']);
  // It runs by default, as a WCAG rule.
  assert.ok(
    runa11yCoreOnHtml(page('', '<p>x</p>')).checksResults.some((r) => r.ruleId === RULE_ID)
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /id="tscl_case_03"/);
});
