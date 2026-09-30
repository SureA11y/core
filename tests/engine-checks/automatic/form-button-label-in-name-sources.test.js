'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'form-button-label-in-name-sources';
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

test(`${RULE_ID}: a button in a form whose accessible name does not contain its label fails`, () => {
  for (const body of [
    '<form><button aria-label="Fermer la fenêtre">Valider</button></form>',
    '<form><input type="submit" value="Envoyer" aria-label="Valider"></form>',
    '<form><input type="button" value="Calculer" aria-labelledby="l"><span id="l">Total</span></form>',
    '<div role="form" aria-label="Recherche"><span role="button" tabindex="0" aria-label="Lancer">Rechercher</span></div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'formButtonLabelInNameSources_summary_fail_name'
    );
  }
});

test(`${RULE_ID}: a title or a losing aria-label without the label is asked about, not failed (11.9.2 methodology checks the name only)`, () => {
  for (const [body, source] of [
    ['<form><button title="Envoyer le formulaire">OK</button></form>', 'title'],
    [
      '<form><button aria-labelledby="l" aria-label="Fermer">Annuler</button><span id="l">Annuler la commande</span></form>',
      'aria-label'
    ],
    ['<form><input type="reset" value="Effacer" title="Remettre à zéro"></form>', 'title']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['cantTell', 'SOURCE_LACKS_VISIBLE_LABEL']], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.i18n.summaryKey, 'formButtonLabelInNameSources_summary_cantTell_source');
    assert.equal(occ.i18n.hintKey, 'formButtonLabelInNameSources_hint_cantTell_source');
    assert.equal(occ.i18n.params.sources, source);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a failing name outranks a failing title on the same button`, () => {
  const rule = assertRule(
    run('<form><button aria-label="Fermer" title="Quitter">Valider</button></form>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']]);
  assert.equal(rule.occurrences[0].i18n.params.sources, 'aria-label');
});

test(`${RULE_ID}: a name that contains the label passes, accents kept whole`, () => {
  for (const body of [
    '<form><button aria-label="Rechercher sur le site">Rechercher</button></form>',
    '<form><button aria-label="Déposer une annonce">Déposer</button></form>',
    '<form><input type="submit" value="Envoyer" title="Envoyer le message"></form>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const rule = assertRule(
    run('<form><button aria-label="Deposer une annonce">Déposer</button></form>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']]);
});

test(`${RULE_ID}: buttons outside a form, image buttons and buttons with no other source are not applicable`, () => {
  for (const body of [
    '<button aria-label="Fermer la fenêtre">Valider</button>',
    '<form id="f"></form><button form="f" aria-label="Fermer">Valider</button>',
    '<form><input type="image" src="a.png" alt="OK" aria-label="Envoyer"></form>',
    '<form><button>Envoyer</button></form>',
    '<form><input type="submit" aria-label="Valider"></form>',
    '<form><button role="tab" aria-label="Fermer">Valider</button></form>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const FORM_PAGE = page('<form><button aria-label="Fermer la fenêtre">Valider</button></form>');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(FORM_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 11.9 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.9' } } }
  ]) {
    const result = runa11yCoreOnHtml(FORM_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.9.2, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['11.9.2']);
  assert.deepEqual(map['label-in-name'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return {
    rgaa: outcome('rgaa-4.1.2-11.9'),
    wcag: outcome('wcag-2.5.3-label-in-name'),
    others: ['rgaa-4.1.2-6.1', 'rgaa-4.1.2-11.2', 'rgaa-4.1.2-7.1'].map(outcome),
    result
  };
}

test(`${RULE_ID}: WCAG fails a replaced name outside a form, RGAA 11.9 does not apply and no other RGAA test gets it`, () => {
  const r = rollups('<button aria-label="Fermer la fenêtre">Valider</button>');
  assert.equal(r.wcag, 'fail');
  assert.equal(r.rgaa, 'notApplicable');
  assert.deepEqual(r.others, ['notApplicable', 'notApplicable', 'notApplicable']);
});

test(`${RULE_ID}: a title without the label is outside WCAG 2.5.3, RGAA 11.9 asks`, () => {
  const r = rollups('<form><button title="Envoyer le formulaire">OK</button></form>');
  assert.equal(r.wcag, 'notApplicable');
  assert.equal(r.rgaa, 'cantTell');
});

test(`${RULE_ID}: WCAG and RGAA agree on a replaced name in a form, reported under 11.9.2 only`, () => {
  const bad = rollups('<form><button aria-label="Fermer la fenêtre">Valider</button></form>');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  assert.deepEqual(bad.others, ['notApplicable', 'notApplicable', 'notApplicable']);
  const good = rollups('<form><button aria-label="Valider la commande">Valider</button></form>');
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-button-label-in-name-sources-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-button-label-in-name-sources-all-scenarios.html'
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
    ['fblins_case_01', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fblins_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fblins_case_03', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fblins_case_04', 'cantTell', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['fblins_case_05', 'cantTell', 'SOURCE_LACKS_VISIBLE_LABEL']
  ]);
});
