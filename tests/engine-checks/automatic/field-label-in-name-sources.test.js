'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'field-label-in-name-sources';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

test(`${RULE_ID}: a title that does not contain the label fails (11.2.5 checks every source)`, () => {
  for (const body of [
    '<label for="x">E-mail</label><input id="x" title="Adresse électronique">',
    '<label for="x">Nom</label><input id="x" aria-labelledby="y" title="Famille"><span id="y">Nom de famille</span>',
    '<span id="l">Recherche</span><input aria-labelledby="l" title="Chercher sur le site">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.params.sources, 'title');
  }
});

test(`${RULE_ID}: a <label> that does not contain the visible label read from aria-labelledby fails`, () => {
  const rule = assertRule(
    run(
      '<span id="l">Recherche</span><label for="x" hidden>Mots</label><input id="x" aria-labelledby="l">'
    ),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
  assert.equal(rule.occurrences[0].i18n.params.sources, '<label>');
});

test(`${RULE_ID}: an accessible name that does not contain the label fails as the name`, () => {
  for (const body of [
    '<label for="x">Nom</label><input id="x" aria-label="Prénom">',
    '<div role="checkbox" aria-checked="false" tabindex="0" aria-label="Accepter les conditions">J’accepte</div>',
    '<label for="s">Pays</label><select id="s" aria-label="Nationalité"><option>France</option></select>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'fieldLabelInNameSources_summary_fail_name');
  }
});

test(`${RULE_ID}: punctuation and capital letters are ignored, accents are not`, () => {
  for (const body of [
    '<label for="x">E-mail :</label><input id="x" title="e-mail">',
    '<label for="x">Déposer</label><input type="file" id="x" title="Déposer un fichier">',
    '<label>Pays <select aria-label="Pays de naissance"><option>France</option></select></label>',
    '<label for="x">Nom</label><input id="x" aria-labelledby="y"><span id="y">Nom de famille</span>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const rule = assertRule(
    run('<label for="x">Déposer</label><input type="file" id="x" title="Deposer un fichier">'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
});

test(`${RULE_ID}: a source that leaves out the text in parentheses is asked about`, () => {
  const rule = assertRule(
    run('<label for="t">Téléphone (facultatif)</label><input type="tel" id="t" title="Téléphone">'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'PARENTHESISED_TEXT_MISSING']]);
});

test(`${RULE_ID}: fields with one source, no visible label, and buttons are not applicable`, () => {
  for (const body of [
    '<label for="x">Ville</label><input id="x">',
    '<input type="search" aria-label="Rechercher">',
    '<input title="Nom" placeholder="Dupont">',
    '<input type="submit" value="Envoyer" aria-label="Valider">',
    '<label for="x">Nom</label><input type="hidden" id="x" title="Autre">',
    '<div hidden><label for="x">Nom</label><input id="x" title="Autre"></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const FIELD_PAGE = page('<label for="x">E-mail</label><input id="x" title="Adresse électronique">');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(FIELD_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 11.2 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.2' } } }
  ]) {
    const result = runa11yCoreOnHtml(FIELD_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.2.5, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['11.2.5']);
  assert.deepEqual(map['label-in-name'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-11.2'), wcag: outcome('wcag-2.5.3-label-in-name'), result };
}

test(`${RULE_ID}: a title without the label is outside WCAG 2.5.3 but fails RGAA 11.2`, () => {
  const r = rollups('<label for="x">E-mail</label><input id="x" title="Adresse électronique">');
  assert.equal(r.wcag, 'notApplicable');
  assert.equal(r.rgaa, 'fail');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-11.2');
  assert.ok(!rgaa.data.details.checksIds.includes('label-in-name'));
});

test(`${RULE_ID}: WCAG and RGAA agree on a replaced name, and neither fails a name that contains the label`, () => {
  const bad = rollups('<label for="x">Nom</label><input id="x" aria-label="Prénom">');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<label for="x">Nom</label><input id="x" aria-label="Nom de famille">');
  assert.equal(good.wcag, 'pass');
  assert.notEqual(good.rgaa, 'fail');
  const own = good.result.checksResults.find((x) => x.ruleId === RULE_ID);
  assert.equal(own.outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/field-label-in-name-sources-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'field-label-in-name-sources-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['fins_case_01', 'fail', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['fins_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_03', 'fail', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['fins_case_04', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_05', 'cantTell', 'PARENTHESISED_TEXT_MISSING']
  ]);
});
