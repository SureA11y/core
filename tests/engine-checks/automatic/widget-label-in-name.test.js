'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'widget-label-in-name';
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

const TAB = (attrs, text) =>
  `<div role="tablist"><div role="tab" tabindex="0" aria-selected="true" ${attrs}>${text}</div></div>`;

test(`${RULE_ID}: a widget whose accessible name does not contain its visible text fails`, () => {
  for (const body of [
    TAB('aria-label="Réglages"', 'Paramètres'),
    '<ul role="menu"><li role="menuitem" tabindex="-1" aria-labelledby="l">Imprimer</li></ul><span id="l">Exporter</span>',
    '<ul role="tree"><li role="treeitem" aria-label="Dossier">Documents</li></ul>',
    '<div role="listbox" aria-label="Couleurs"><div role="option" aria-selected="false" aria-label="Bleu">Rouge</div></div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'widgetLabelInName_summary_fail_name');
  }
});

test(`${RULE_ID}: a single letter that may be a symbol is asked about`, () => {
  const rule = assertRule(
    run(
      '<ul role="menu"><li role="menuitem" tabindex="-1" aria-label="Mettre en gras">B</li></ul>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'POSSIBLE_SYMBOL']]);
});

test(`${RULE_ID}: a name that contains the visible text passes; punctuation and case ignored`, () => {
  for (const body of [
    TAB('aria-label="Paramètres avancés"', 'Paramètres'),
    TAB('aria-label="PARAMÈTRES !"', 'Paramètres')
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a title is not checked, and links, buttons and fields are other rules' business`, () => {
  for (const body of [
    TAB('title="Réglages"', 'Paramètres'),
    TAB('', 'Paramètres'),
    '<button aria-label="Fermer">Valider</button>',
    '<a href="/c" aria-label="Écrire">Contact</a>',
    '<div role="checkbox" aria-checked="false" tabindex="0" aria-label="Accepter">J’accepte</div>',
    '<select><option aria-label="Bleu">Rouge</option></select>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const WIDGET_PAGE = page(TAB('aria-label="Réglages"', 'Paramètres'));

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(WIDGET_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 7.1 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-7.1' } } }
  ]) {
    const result = runa11yCoreOnHtml(WIDGET_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 7.1.3, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['7.1.3']);
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
    rgaa: outcome('rgaa-4.1.2-7.1'),
    wcag: outcome('wcag-2.5.3-label-in-name'),
    others: ['rgaa-4.1.2-6.1', 'rgaa-4.1.2-11.2', 'rgaa-4.1.2-11.9'].map(outcome)
  };
}

test(`${RULE_ID}: WCAG and RGAA agree on a replaced tab name, reported under 7.1.3 only`, () => {
  const bad = rollups(TAB('aria-label="Réglages"', 'Paramètres'));
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  assert.deepEqual(bad.others, ['notApplicable', 'notApplicable', 'notApplicable']);
  const good = rollups(TAB('aria-label="Paramètres avancés"', 'Paramètres'));
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'pass');
});

test(`${RULE_ID}: WCAG asks about a hyphenation difference, RGAA ignores punctuation and passes`, () => {
  const r = rollups(TAB('aria-label="Email"', 'E-mail'));
  assert.equal(r.wcag, 'cantTell');
  assert.equal(r.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/widget-label-in-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'widget-label-in-name-all-scenarios.html'
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
    ['wlin_case_01', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_03', 'cantTell', 'POSSIBLE_SYMBOL']
  ]);
});
