'use strict';

/**
 * acme-contrast-uniform: a variant of contrast-minimum with large text
 * needing 4.5:1 too (finding F8, DESIGN.md). It runs contrast-minimum's code,
 * so these tests check what the variant changes, not the contrast
 * computation itself, which contrast-minimum's tests cover.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'acme-contrast-uniform';

const page = (style, text) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  `<main><p style="${style};background:#fff">${text}</p></main></body></html>`;
// #777 on #fff is about 4.48:1; #666 about 5.74:1.
const LARGE_GREY = page('font-size:32px;color:#777', 'Large grey text');

const scan = (html, engineOptions = { profile: 'acme-2.0' }) =>
  runa11yCoreOnHtml(html, { engineOptions });
const result = (r, id) => r.checksResults.find((c) => c.ruleId === id);

test(`${RULE_ID}: large text WCAG passes at 3:1 fails ACME's 4.5:1`, () => {
  const r = scan(LARGE_GREY);
  assert.equal(result(r, 'contrast-minimum').outcome, 'pass');
  const rule = assertRule(r, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BELOW_THRESHOLD');
});

test(`${RULE_ID}: large text at 4.5:1 or more passes`, () => {
  assertRule(scan(page('font-size:32px;color:#666', 'Large text')), RULE_ID, 'pass');
});

test(`${RULE_ID}: it reports in its own words, in each of ACME's languages`, () => {
  const occurrence = (locale) =>
    result(scan(LARGE_GREY, { profile: 'acme-2.0', locale }), RULE_ID).occurrences[0];
  const en = occurrence('en');
  assert.equal(en.i18n.summaryKey, 'acmeContrastUniform_fail_belowThreshold');
  assert.match(en.summary, /below ACME's 4\.5:1/);
  assert.match(occurrence('es').summary, /por debajo del 4,5:1 de ACME/);
});

test(`${RULE_ID}: it leaves contrast-minimum's results as they are`, () => {
  const html = page('font-size:16px;color:#777', 'Normal grey text');
  const withAcme = result(scan(html), 'contrast-minimum');
  const wcagOnly = result(scan(html, { profile: 'wcag22-aa' }), 'contrast-minimum');
  assert.equal(withAcme.outcome, wcagOnly.outcome);
  assert.equal(withAcme.occurrences[0].i18n.summaryKey, 'contrastMinimum_fail_belowThreshold');
});

test(`${RULE_ID}: no default or WCAG run includes it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    assert.equal(result(scan(LARGE_GREY, engineOptions), RULE_ID), undefined);
  }
});

test(`${RULE_ID}: fixture coverage (fixtures/acme-contrast-uniform-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(scan(html), RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => o.selector).sort();
  assert.deepEqual(ids, ['#case_01_target', '#case_02_target']);
});
