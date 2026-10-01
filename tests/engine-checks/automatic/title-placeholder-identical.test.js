'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../profiles/rgaa/rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'title-placeholder-identical';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

test(`${RULE_ID}: a field whose title and placeholder differ is asked about`, () => {
  for (const body of [
    '<label for="a">Nom</label><input id="a" title="Nom de famille" placeholder="Dupont">',
    '<input title="Nom" placeholder="Jean Dupont">',
    '<textarea title="Message" placeholder="Votre message"></textarea>',
    '<input type="search" title="Rechercher" placeholder="rechercher">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.occurrenceOutcome, 'cantTell', body);
    assert.equal(occ.data.details.reasonCode, 'TITLE_PLACEHOLDER_DIFFER');
    assert.equal(occ.i18n.summaryKey, 'titlePlaceholderIdentical_summary_cantTell');
    assert.equal(occ.i18n.hintKey, 'titlePlaceholderIdentical_hint_cantTell');
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
  const rule = assertRule(run('<input title="Nom" placeholder="Dupont">'), RULE_ID, 'cantTell');
  assert.equal(
    rule.occurrences[0].summary,
    'The title ("Nom") and the placeholder ("Dupont") of this form field differ.'
  );
});

test(`${RULE_ID}: identical values pass, whitespace aside`, () => {
  for (const body of [
    '<input title="Nom" placeholder="Nom">',
    '<input type="email" title=" Adresse  e-mail" placeholder="Adresse e-mail ">'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: one attribute missing or empty, fields with no placeholder and hidden fields are not applicable`, () => {
  for (const body of [
    '<input placeholder="Nom" aria-label="Nom">',
    '<input title="Nom">',
    '<input title="" placeholder="Nom">',
    '<input type="checkbox" title="Accepter" placeholder="Oui">',
    '<input type="hidden" title="a" placeholder="b">',
    '<div hidden><input title="a" placeholder="b"></div>',
    '<select title="Pays"><option>France</option></select>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const PAGE = page('<input title="Nom" placeholder="Dupont">');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions });
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
    const result = runa11yCoreOnHtml(PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.2.2`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.2.2']);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-11.2'), wcag: outcome('wcag-4.1.2-name') };
}

test(`${RULE_ID}: WCAG passes a labelled field whose title and placeholder differ, RGAA 11.2 asks`, () => {
  const r = rollups(
    '<label for="a">Nom</label><input id="a" title="Nom de famille" placeholder="Dupont">'
  );
  assert.equal(r.wcag, 'pass');
  assert.equal(r.rgaa, 'cantTell');
});

test(`${RULE_ID}: WCAG and RGAA agree when the two are identical`, () => {
  const r = rollups('<label for="a">Nom</label><input id="a" title="Nom" placeholder="Nom">');
  assert.equal(r.wcag, 'pass');
  assert.equal(r.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/title-placeholder-identical-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'title-placeholder-identical-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['tpi_case_01', 'cantTell', 'TITLE_PLACEHOLDER_DIFFER'],
    ['tpi_case_02', 'cantTell', 'TITLE_PLACEHOLDER_DIFFER'],
    ['tpi_case_03', 'cantTell', 'TITLE_PLACEHOLDER_DIFFER']
  ]);
});
