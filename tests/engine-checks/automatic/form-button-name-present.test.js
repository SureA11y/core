'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../profiles/rgaa/rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'form-button-name-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a button in a form with no label fails`, () => {
  for (const body of [
    '<form><button></button></form>',
    '<form><input type="button"></form>',
    '<form><button><img src="a.png" alt=""></button></form>',
    '<div role="form" aria-label="Filtres"><span role="button" tabindex="0"></span></div>',
    '<form><fieldset><div><button type="submit"> </button></div></fieldset></form>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['fail', 'nameMissing']], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.i18n.summaryKey, 'formButtonNamePresent_summary_fail_nameMissing');
    assert.equal(occ.i18n.hintKey, 'formButtonNamePresent_hint_fail_nameMissing');
    assert.equal(occ.summary, 'This button in a form has no label.');
  }
});

test(`${RULE_ID}: every label source the glossary lists passes`, () => {
  for (const body of [
    '<div role="form" aria-label="Connexion"><button>OK</button></div>',
    '<form><button aria-label="Fermer"></button></form>',
    '<form><span id="l">Envoyer</span><button aria-labelledby="l"></button></form>',
    '<form><button title="Fermer"></button></form>',
    '<form><input type="button" value="Calculer"></form>',
    '<form><input type="image" src="a.png" alt="Rechercher"></form>',
    '<form><button><svg role="img"><title>Rechercher</title></svg></button></form>',
    '<form><button><img src="a.png" alt="Rechercher"></button></form>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a submit or reset input with no value shows the browser label and passes`, () => {
  assertRule(
    runa11yCoreOnHtml(page('<form><input type="submit"><input type="reset"></form>'), RUN),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: an image button with no alt is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<form><input type="image" src="a.png"></form>'), RUN),
    RULE_ID,
    'cantTell',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'imageButtonNoAlt']]);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'formButtonNamePresent_summary_cantTell_imageButtonNoAlt'
  );
});

test(`${RULE_ID}: a nameless button that joins a form from outside is asked about`, () => {
  const html = page('<form id="f" action="/send"></form><button form="f"></button>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), [['cantTell', 'formAttributeOnly']]);
  // Named, it passes; a form attribute that names no form leaves it out.
  assertRule(
    runa11yCoreOnHtml(page('<form id="f"></form><button form="f">Envoyer</button>'), RUN),
    RULE_ID,
    'pass'
  );
  assertRule(
    runa11yCoreOnHtml(page('<div id="f"></div><button form="f"></button>'), RUN),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: buttons outside a form, other roles and hidden buttons are not applicable`, () => {
  for (const body of [
    '<button onclick="void 0"></button>',
    '<div role="button" tabindex="0"></div>',
    '<form><button role="tab"></button></form>',
    '<form><button role="none" disabled></button></form>',
    '<form><button aria-hidden="true" tabindex="-1"></button></form>',
    '<form><div hidden><button></button></div></form>',
    '<form><input type="text" aria-label="Nom"></form>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a fail and a question on one page give fail with both occurrences`, () => {
  const html = page('<form><button></button><input type="image" src="a.png"></form>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail');
  assert.deepEqual(reasons(rule), [
    ['fail', 'nameMissing'],
    ['cantTell', 'imageButtonNoAlt']
  ]);
});

// --- opt-in gate -------------------------------------------------------------

const FORM_PAGE = page('<form><button></button></form>');

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

test(`${RULE_ID}: the map links it to 11.9.1, and button-name-present no longer`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['11.9.1']);
  assert.deepEqual(map['button-name-present'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (id) => {
    const r = result.rulesResults.find((x) => x.ruleId === id);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-11.9'), wcag: outcome('wcag-4.1.2-name'), result };
}

test(`${RULE_ID}: WCAG fails an unnamed button outside a form, RGAA 11.9 does not apply`, () => {
  const r = rollups('<button onclick="void 0"></button>');
  assert.equal(r.wcag, 'fail');
  assert.equal(r.rgaa, 'notApplicable');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-11.9');
  assert.ok(!rgaa.data.details.checksIds.includes('button-name-present'));
});

test(`${RULE_ID}: WCAG and RGAA agree on an unnamed button in a form and on a named one`, () => {
  const bad = rollups('<form><button></button></form>');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<div role="form" aria-label="Connexion"><button>OK</button></div>');
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-button-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-button-name-present-all-scenarios.html'
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
    ['fbnp_case_01', 'fail', 'nameMissing'],
    ['fbnp_case_02', 'fail', 'nameMissing'],
    ['fbnp_case_03', 'fail', 'nameMissing'],
    ['fbnp_case_04', 'cantTell', 'imageButtonNoAlt'],
    ['fbnp_case_05', 'cantTell', 'formAttributeOnly']
  ]);
});
