'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'field-group-legend';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const FLAGGED = '<fieldset><input aria-label="Street"><input aria-label="City"></fieldset>';

test(`${RULE_ID}: a fieldset without a legend is flagged, never failed`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, { reasonCode: 'groupWithoutLegend', element: 'fieldset' });
  assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_fieldset');
  assert.equal(occ.summary, 'This fieldset groups form fields but has no legend.');
});

test(`${RULE_ID}: an empty legend counts as none`, () => {
  const html = page('<fieldset><legend> </legend><input aria-label="a"></fieldset>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: role="group" without a name is flagged with its own summary`, () => {
  const html = page('<div role="group"><input type="checkbox" aria-label="a"></div>');
  const occ = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.equal(occ.data.details.element, 'role="group"');
  assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_group');
});

// RGAA 11.6.1 step 2 names a <legend> for a fieldset and aria-label or
// aria-labelledby for role="group"/"radiogroup", nothing else.
test(`${RULE_ID}: a fieldset legend, or aria-label/aria-labelledby on a group, is enough`, () => {
  for (const body of [
    '<fieldset><legend>Address</legend><input aria-label="a"></fieldset>',
    '<div role="group" aria-label="Date"><input aria-label="a"></div>',
    '<p id="h">Date</p><div role="group" aria-labelledby="h"><input aria-label="a"></div>',
    '<div role="radiogroup" aria-label="Civility"><input type="radio" name="c" aria-label="Mr"></div>',
    '<fieldset role="radiogroup" aria-label="Civility"><input type="radio" name="c" aria-label="Mr"></fieldset>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: aria-label on a plain fieldset, and title on a group, are not a legend`, () => {
  for (const [body, element] of [
    ['<fieldset aria-label="Address"><input aria-label="a"></fieldset>', 'fieldset'],
    [
      '<p id="h">Address</p><fieldset aria-labelledby="h"><input aria-label="a"></fieldset>',
      'fieldset'
    ],
    ['<div role="group" title="Address"><input aria-label="a"></div>', 'role="group"']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.element, element, body);
  }
});

test(`${RULE_ID}: role="radiogroup" without aria-label or aria-labelledby is flagged`, () => {
  for (const body of [
    '<div role="radiogroup"><input type="radio" name="c" aria-label="Mr"></div>',
    '<div role="radiogroup" title="Civility"><div role="radio" aria-checked="false" aria-label="Mr"></div></div>'
  ]) {
    const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    }).occurrences[0];
    assert.equal(occ.data.details.element, 'role="radiogroup"');
    assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_group');
    assert.deepEqual(occ.i18n.params, { role: 'radiogroup' });
    assert.equal(
      occ.summary,
      'This role="radiogroup" element groups form fields but has no aria-label or aria-labelledby.'
    );
  }
});

test(`${RULE_ID}: groups without form fields, and fieldsets given another role, are left out`, () => {
  for (const body of [
    '<div role="group"><button>Bold</button></div>',
    '<fieldset><input type="hidden" name="t"></fieldset>',
    '<fieldset role="presentation"><input aria-label="a"></fieldset>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/field-group-legend-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'field-group-legend-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'fgl_case_01',
    'fgl_case_02',
    'fgl_case_03',
    'fgl_case_07',
    'fgl_case_08',
    'fgl_case_09'
  ]);
});
