'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../profiles/rgaa/rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'field-label-listed-source';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a placeholder is not a label`, () => {
  for (const body of [
    '<input type="text" placeholder="Nom">',
    '<input role="textbox" placeholder="Rechercher">',
    '<textarea placeholder="Message"></textarea>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'placeholderOnly', body);
    assert.equal(occ.i18n.summaryKey, 'fieldLabelListedSource_summary_fail_placeholderOnly');
    assert.equal(occ.i18n.hintKey, 'fieldLabelListedSource_hint_fail_placeholderOnly');
  }
});

test(`${RULE_ID}: a checkbox, radio or switch named by its content fails`, () => {
  for (const role of ['checkbox', 'radio', 'switch']) {
    const html = page(`<div role="${role}" aria-checked="false" tabindex="0">J’accepte</div>`);
    const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'contentOnly']], role);
  }
});

test(`${RULE_ID}: native meter, progress and output with no label fail`, () => {
  const html = page(
    '<meter value="0.5"></meter><progress value="1" max="2"></progress><output>5</output>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  assert.deepEqual(
    rule.occurrences.map((o) => [o.data.details.field, o.data.details.reasonCode]),
    [
      ['meter', 'noLabel'],
      ['progress', 'noLabel'],
      ['output', 'noLabel']
    ]
  );
});

test(`${RULE_ID}: a field with nothing fails, and a dangling aria-labelledby counts as nothing`, () => {
  for (const body of [
    '<input type="text">',
    '<input type="email" aria-labelledby="nowhere">',
    '<div role="textbox" contenteditable="true">abc</div>',
    '<input type="range">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['fail', 'noLabel']], body);
    assert.equal(
      rule.occurrences[0].summary,
      'This form field has no aria-labelledby, aria-label, <label for> or title.'
    );
  }
});

test(`${RULE_ID}: each source 11.1.1 lists passes`, () => {
  for (const body of [
    '<label for="n">Nom</label><input id="n">',
    '<span id="v">Ville</span><input aria-labelledby="v">',
    '<input aria-label="Ville">',
    '<select title="Civilité"><option>Madame</option></select>',
    '<div role="switch" aria-checked="false" tabindex="0" aria-label="Notifications"></div>',
    '<input type="checkbox" role="switch" title="Notifications">',
    '<label for="p">Chargement</label><progress id="p" role="progressbar" value="5" max="10"></progress>',
    // A <label for> on a non-labelable field adds nothing, but aria-label is there.
    '<label for="t">Nom</label><div role="textbox" aria-label="Nom" id="t"></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a wrapping label without for is asked about`, () => {
  for (const body of [
    '<label>Nom <input type="text"></label>',
    '<label><select><option></option></select> Pays</label>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', 'wrappingLabel']], body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'fieldLabelListedSource_summary_cantTell_wrappingLabel'
    );
  }
});

test(`${RULE_ID}: a label for pointing at an element a label cannot name is asked about`, () => {
  for (const body of [
    '<label for="l">Pays</label><div role="listbox" id="l" tabindex="0"><div role="option" aria-selected="true">France</div></div>',
    '<label for="t">Nom</label><div role="textbox" contenteditable="true" id="t"></div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', 'labelForNotLabelable']], body);
  }
});

test(`${RULE_ID}: an empty source is asked about and named`, () => {
  for (const [body, source] of [
    ['<input aria-label="">', 'aria-label'],
    ['<input title=" ">', 'title'],
    ['<label for="e"></label><input id="e">', 'label-for'],
    ['<span id="z"></span><input aria-labelledby="z">', 'aria-labelledby']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'emptySource', body);
    assert.equal(occ.data.details.source, source);
    assert.deepEqual(occ.i18n.params, { source });
    assert.equal(occ.summary, `This form field has a ${source} label source, but it is empty.`);
  }
});

test(`${RULE_ID}: a fail and a question on one page give fail with both occurrences`, () => {
  const html = page('<input type="text"><label>Nom <input type="text"></label>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail');
  assert.deepEqual(reasons(rule), [
    ['fail', 'noLabel'],
    ['cantTell', 'wrappingLabel']
  ]);
});

test(`${RULE_ID}: buttons, hidden inputs, options and hidden fields are not applicable`, () => {
  for (const body of [
    '<input type="submit"><input type="reset"><input type="button"><input type="image" alt="Go"><input type="hidden">',
    '<button></button><div role="button" tabindex="0"></div>',
    '<div hidden><input></div>',
    '<input aria-hidden="true">',
    '<p>No field</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  // The options of a labelled select are not fields of their own.
  assertRule(
    runa11yCoreOnHtml(
      page(
        '<label for="s">Pays</label><select id="s"><option></option><optgroup label="x"><option>a</option></optgroup></select>'
      ),
      RUN
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

// --- opt-in gate -------------------------------------------------------------

const PLACEHOLDER_PAGE = page('<input type="text" placeholder="Nom">');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(PLACEHOLDER_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 11.1 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.1' } } }
  ]) {
    const result = runa11yCoreOnHtml(PLACEHOLDER_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.1.1 alone, and the WCAG field-name rules no longer`, () => {
  const tests = (id) => RGAA_RULE_TESTS['4.1.2'][id].tests;
  assert.deepEqual(tests(RULE_ID), ['11.1.1']);
  for (const id of [
    'aria-role-name-present',
    'binary-control-name-present',
    'combobox-name-present',
    'listbox-name-present',
    'searchbox-name-present',
    'slider-name-present',
    'spinbutton-name-present',
    'textbox-name-present',
    'meter-name-present',
    'progressbar-name-present',
    'form-control-programmatic-label-present',
    'form-control-programmatic-label-quality'
  ]) {
    assert.ok(!tests(id).includes('11.1.1'), id);
  }
  assert.deepEqual(tests('aria-role-name-present'), ['7.1.1', '11.6.1']);
  assert.deepEqual(tests('form-control-programmatic-label-quality'), ['11.1.3', '11.2.2']);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (id) => {
    const r = result.rulesResults.find((x) => x.ruleId === id);
    return r ? r.outcome : 'missing';
  };
  return {
    rgaa: outcome('rgaa-4.1.2-11.1'),
    wcagName: outcome('wcag-4.1.2-name'),
    wcagNonText: outcome('wcag-1.1.1-non-text-content'),
    result
  };
}

test(`${RULE_ID}: WCAG passes a checkbox named by its content, RGAA 11.1 fails it`, () => {
  const r = rollups('<div role="checkbox" aria-checked="false" tabindex="0">J’accepte</div>');
  assert.equal(r.wcagName, 'pass');
  assert.equal(r.rgaa, 'fail');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-11.1');
  assert.ok(rgaa.data.details.checksIds.includes(RULE_ID));
  assert.ok(!rgaa.data.details.checksIds.includes('binary-control-name-present'));
});

test(`${RULE_ID}: WCAG asks about a placeholder-only field, RGAA 11.1 fails it`, () => {
  const r = rollups('<input type="text" placeholder="Nom">');
  assert.equal(r.wcagName, 'cantTell');
  assert.equal(r.rgaa, 'fail');
});

test(`${RULE_ID}: WCAG fails a role="meter" named by <label for>, RGAA 11.1 passes it`, () => {
  const r = rollups(
    '<label for="m">Remplissage</label><meter id="m" role="meter" value="0.5"></meter>'
  );
  assert.equal(r.wcagNonText, 'fail');
  assert.equal(r.rgaa, 'pass');
});

test(`${RULE_ID}: WCAG fails a <label for> on a role="listbox", RGAA 11.1 asks`, () => {
  const r = rollups(
    '<label for="l">Pays</label><div role="listbox" id="l" tabindex="0"><div role="option" aria-selected="true">France</div></div>'
  );
  assert.equal(r.wcagName, 'fail');
  assert.equal(r.rgaa, 'cantTell');
});

test(`${RULE_ID}: WCAG and RGAA agree on an unlabelled field and on a <label for>`, () => {
  const bad = rollups('<input type="text">');
  assert.equal(bad.wcagName, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<label for="n">Nom</label><input type="text" id="n">');
  assert.equal(good.wcagName, 'pass');
  assert.equal(good.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/field-label-listed-source-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'field-label-listed-source-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  assert.deepEqual(got, [
    ['flls_case_01', 'fail', 'placeholderOnly'],
    ['flls_case_02', 'fail', 'placeholderOnly'],
    ['flls_case_03', 'fail', 'contentOnly'],
    ['flls_case_04', 'fail', 'noLabel'],
    ['flls_case_05', 'fail', 'noLabel'],
    ['flls_case_06', 'fail', 'noLabel'],
    ['flls_case_07', 'fail', 'noLabel'],
    ['flls_case_08', 'cantTell', 'wrappingLabel'],
    ['flls_case_09', 'cantTell', 'labelForNotLabelable'],
    ['flls_case_10', 'cantTell', 'emptySource']
  ]);
});
