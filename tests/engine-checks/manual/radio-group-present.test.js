'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'radio-group-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const radio = (name, label, extra = '') =>
  `<label><input type="radio" name="${name}" ${extra}> ${label}</label>`;
const FLAGGED = radio('delivery', 'Standard', 'id="first"') + radio('delivery', 'Express');

test(`${RULE_ID}: radio buttons sharing a name outside any group are flagged once, on the first`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /id="first"/);
  assert.deepEqual(occ.data.details, {
    reasonCode: 'radiosNotGrouped',
    name: 'delivery',
    count: 2
  });
  assert.deepEqual(occ.i18n.params, { count: '2', name: 'delivery' });
  assert.equal(
    occ.summary,
    'The 2 radio buttons named "delivery" are not grouped in one fieldset or group.'
  );
});

test(`${RULE_ID}: a set in one fieldset, role="group" or role="radiogroup" is not flagged`, () => {
  const set = radio('c', 'Red') + radio('c', 'Blue');
  for (const body of [
    `<fieldset><legend>Colour</legend>${set}</fieldset>`,
    `<div role="group" aria-label="Colour">${set}</div>`,
    `<div role="radiogroup" aria-label="Colour"><div>${set}</div></div>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a set split across two groups is flagged`, () => {
  const body =
    `<fieldset><legend>A</legend>${radio('s', 'Small')}</fieldset>` +
    `<fieldset><legend>B</legend>${radio('s', 'Large')}</fieldset>`;
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell');
});

// RGAA 11.5.1 asks that the set is grouped in a fieldset or group; an outer
// one holding every radio does that even when inner groups split the set.
test(`${RULE_ID}: an outer fieldset or group holding the whole set is enough`, () => {
  for (const body of [
    '<fieldset><legend>Livraison</legend>' +
      `<div role="group" aria-label="Rapide">${radio('x', 'Express')}${radio('x', 'Coursier')}</div>` +
      `${radio('x', 'Standard')}</fieldset>`,
    '<div role="radiogroup" aria-label="Size">' +
      `<fieldset><legend>A</legend>${radio('s', 'Small')}</fieldset>` +
      `<fieldset><legend>B</legend>${radio('s', 'Large')}</fieldset></div>`
  ]) {
    for (const options of [RUN, { engineOptions: { profile: 'rgaa-4.1.2' } }]) {
      assertRule(runa11yCoreOnHtml(page(body), options), RULE_ID, 'notApplicable', {
        maxOccurrences: 0
      });
    }
  }
});

test(`${RULE_ID}: a single radio, or one per form under the same name, is not a set`, () => {
  for (const body of [
    radio('agree', 'I agree'),
    `<form>${radio('a', 'One')}</form><form>${radio('a', 'Two')}</form>`,
    '<input type="radio" aria-label="x"><input type="radio" aria-label="y">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/radio-group-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'radio-group-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['rgp_case_01', 'rgp_case_02']);
});
