'use strict';

// form-group-name-present: radio buttons, or checkboxes, that share a name
// and sit in no group with a name are asked about (WCAG 1.3.1, H71, ARIA17;
// round 10, G10-1).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'form-group-name-present';

function run(body, engineOptions) {
  return runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><form>${body}</form></main></body></html>`,
    { runOnly: [RULE_ID], ...(engineOptions ? { engineOptions } : {}) }
  );
}

const RADIOS =
  '<label><input type="radio" name="ship" id="r1"> Standard</label><label><input type="radio" name="ship"> Express</label>';
const CHECKBOXES =
  '<label><input type="checkbox" name="i" id="c1"> Music</label><label><input type="checkbox" name="i"> Sport</label>';

test(`${RULE_ID}: radio buttons sharing a name in no named group are asked about, leaning fail`, () => {
  const rule = assertRule(run(`<p>Shipping method</p>${RADIOS}`), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.ok(occ.html.includes('id="r1"'));
  assert.deepEqual(occ.data.details, {
    reasonCode: 'RADIO_GROUP_NO_NAME',
    name: 'ship',
    count: 2,
    inputType: 'radio'
  });
  assert.equal(occ.i18n.summaryKey, 'formGroupNamePresent_summary_cantTell_radio');
  assert.equal(occ.lean.toward, 'fail');
  assert.equal(occ.lean.i18n.whyKey, 'formGroupNamePresent_lean_why_radio');
});

test(`${RULE_ID}: checkboxes sharing a name in no named group are asked about, with no lean`, () => {
  const occ = assertRule(run(`<p>Interests</p>${CHECKBOXES}`), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  }).occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'CHECKBOX_GROUP_NO_NAME');
  assert.equal(occ.i18n.summaryKey, 'formGroupNamePresent_summary_cantTell_checkbox');
  assert.equal(occ.lean, undefined);
});

test(`${RULE_ID}: a group with a name passes`, () => {
  for (const body of [
    `<fieldset><legend>Shipping</legend>${RADIOS}</fieldset>`,
    `<fieldset aria-label="Shipping">${RADIOS}</fieldset>`,
    `<p id="q">Shipping</p><div role="radiogroup" aria-labelledby="q">${RADIOS}</div>`,
    `<div role="group" aria-label="Interests">${CHECKBOXES}</div>`,
    // a legend named by its content: an image's alt text (B11-6)
    `<fieldset><legend><img alt="Shipping" src="x.png"></legend>${RADIOS}</fieldset>`,
    `<fieldset><legend><svg role="img" aria-label="Shipping" width="10" height="10"></svg></legend>${RADIOS}</fieldset>`,
    // a named fieldset around more than the group
    `<fieldset><legend>Delivery</legend><div>${RADIOS}</div><label>Notes <input name="n"></label></fieldset>`
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an unnamed fieldset or group, or one around only some options, is no named group`, () => {
  for (const body of [
    `<fieldset>${RADIOS}</fieldset>`,
    `<fieldset><legend> </legend>${RADIOS}</fieldset>`,
    `<div role="radiogroup">${RADIOS}</div>`,
    `<fieldset role="presentation"><legend>Shipping</legend>${RADIOS}</fieldset>`,
    '<fieldset><legend>Standard</legend><label><input type="radio" name="ship"> Standard</label></fieldset><label><input type="radio" name="ship"> Express</label>'
  ]) {
    assertRule(run(body), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: radio buttons sharing a name split over named groups are asked about, with no lean (round 12, U12-14)`, () => {
  const split =
    '<fieldset><legend>A</legend><input type="radio" name="s" aria-label="a" id="a"></fieldset><fieldset><legend>B</legend><input type="radio" name="s" aria-label="b"></fieldset>';
  const occ = assertRule(run(split), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  }).occurrences[0];
  assert.ok(occ.html.includes('id="a"'));
  assert.deepEqual(occ.data.details, {
    reasonCode: 'RADIO_GROUP_SPLIT',
    name: 's',
    count: 2,
    inputType: 'radio',
    groups: ['A', 'B']
  });
  assert.equal(occ.i18n.summaryKey, 'formGroupNamePresent_summary_cantTell_radio_split');
  assert.equal(occ.i18n.params.groups, 'A, B');
  assert.match(
    occ.summary,
    /share a name, so a browser makes them one choice, but sit in different groups with names \(A, B\)/
  );
  assert.doesNotMatch(occ.summary, /no group with a name/);
  assert.equal(occ.lean, undefined);
  const { howToCheckFor } = require('../../../src/how-to-check');
  for (const locale of ['en', 'es', 'de', 'fr', 'ja']) {
    const how = howToCheckFor(RULE_ID, 'RADIO_GROUP_SPLIT', locale);
    assert.ok(how && how.steps.length === 3 && how.passWhen && how.failWhen, locale);
  }

  // Each locale has the message.
  const de = run(split, { locale: 'de' }).checksResults.find((r) => r.ruleId === RULE_ID)
    .occurrences[0];
  assert.match(de.summary, /verschiedenen Gruppen mit Namen \(A, B\)/);

  // Two named groups inside one named group: one group with a name.
  assertRule(run(`<fieldset><legend>Choose</legend>${split}</fieldset>`), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  // Checkboxes in different named groups are asked about as before.
  const cb = assertRule(run(split.replace(/radio/g, 'checkbox')), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  }).occurrences[0];
  assert.equal(cb.data.details.reasonCode, 'CHECKBOX_GROUP_NO_NAME');

  // Some options in a named group and some in none: asked about as options
  // in no named group, leaning fail, at the first option in no group.
  const mixed = assertRule(
    run(
      '<fieldset><legend>A</legend><input type="radio" name="s" aria-label="a"></fieldset><input type="radio" name="s" aria-label="b" id="b"><input type="radio" name="s" aria-label="c">'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  ).occurrences[0];
  assert.ok(mixed.html.includes('id="b"'));
  assert.equal(mixed.data.details.reasonCode, 'RADIO_GROUP_NO_NAME');
  assert.equal(mixed.data.details.count, 3);
  assert.equal(mixed.i18n.summaryKey, 'formGroupNamePresent_summary_cantTell_radio_some');
  assert.match(
    mixed.summary,
    /^Some of these 3 radio buttons named “s” are in no group with a name/
  );
  assert.equal(mixed.lean.toward, 'fail');
});

test(`${RULE_ID}: a single checkbox, options without a shared name, and hidden options are no group`, () => {
  for (const body of [
    '<label><input type="checkbox" name="terms"> I agree</label>',
    '<label><input type="radio" name="a"> A</label><label><input type="radio" name="b"> B</label>',
    '<label><input type="radio"> A</label><label><input type="radio"> B</label>',
    '<label><input type="radio" name="g"> A</label><label hidden><input type="radio" name="g"> B</label>',
    // under aria-hidden: out of the accessibility tree (B11-8)
    '<div aria-hidden="true"><label><input type="radio" name="h"> A</label><label><input type="radio" name="h"> B</label></div>',
    // a radio and a checkbox sharing a name are not one group
    '<label><input type="radio" name="x"> A</label><label><input type="checkbox" name="x"> B</label>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
  // The same name in two forms is two groups of one.
  const twoForms = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><body><form><input type="radio" name="s" aria-label="A"></form><form><input type="radio" name="s" aria-label="B"></form></body></html>',
    { runOnly: [RULE_ID] }
  );
  assertRule(twoForms, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a named group made through shadow DOM contains the options in the flat tree`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const R2 =
    '<label><input type="radio" name="s"> S</label><label><input type="radio" name="s"> M</label>';
  const cases = [
    // light radios slotted into a shadow <fieldset>
    [`<x-group id="h">${R2}</x-group>`, '<fieldset><legend>Size</legend><slot></slot></fieldset>'],
    // radios in a shadow root inside a light <fieldset>
    ['<fieldset><legend>Size</legend><x-r id="h"></x-r></fieldset>', R2],
    // a named radiogroup in the shadow root, radios slotted
    [
      `<x-g id="h">${R2}</x-g>`,
      '<p id="q">Size</p><div role="radiogroup" aria-labelledby="q"><slot></slot></div>'
    ]
  ];
  for (const [light, shadow] of cases) {
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${light}</main></body></html>`
    );
    dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: the summary names the group in every locale`, () => {
  const occ = run(`<p>Versand</p>${RADIOS}`, { locale: 'de' }).checksResults.find(
    (r) => r.ruleId === RULE_ID
  ).occurrences[0];
  assert.match(occ.summary, /Diese 2 Optionsfelder mit dem Namen „ship“/);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-group-name-present-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'form-group-name-present-all-scenarios.html'),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 5,
    maxOccurrences: 5
  });
  const ids = rule.occurrences.map((o) => /id="(fgn_case_\d+)"/.exec(o.html)[1]);
  assert.deepEqual(ids, [
    'fgn_case_01',
    'fgn_case_02',
    'fgn_case_03',
    'fgn_case_04',
    'fgn_case_11'
  ]);
  assert.deepEqual(
    rule.occurrences.map((o) => (o.lean ? o.lean.toward : null)),
    ['fail', null, 'fail', 'fail', null]
  );
  assert.equal(rule.occurrences[4].data.details.reasonCode, 'RADIO_GROUP_SPLIT');
});

test(`${RULE_ID}: hidden legends and options the flat tree leaves out (round 11, R11F-11)`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  for (const [
    label,
    light,
    shadow,
    outcome
  ] of require('./form-group-name-present-round-11-cases.js')) {
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${light}</main></body></html>`
    );
    if (shadow)
      dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    const r = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }).checksResults.find(
      (c) => c.ruleId === RULE_ID
    );
    assert.strictEqual(r.outcome, outcome, label);
  }
});
