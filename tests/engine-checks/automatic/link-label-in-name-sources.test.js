'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-label-in-name-sources';
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

test(`${RULE_ID}: a title that does not contain the visible label fails (6.1.5 checks every source)`, () => {
  const rule = assertRule(
    run('<a href="/c" title="Ouvre une nouvelle fenêtre">Contact</a>'),
    RULE_ID,
    'fail',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
  const occ = rule.occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'linkLabelInNameSources_summary_fail_source');
  assert.equal(occ.i18n.hintKey, 'linkLabelInNameSources_hint_fail_source');
  assert.equal(
    occ.summary,
    'a: the title of this link does not contain its visible label "Contact".'
  );
  assert.deepEqual(occ.data.details.sources, [
    { source: 'title', text: 'Ouvre une nouvelle fenêtre', verdict: 'no' }
  ]);
});

test(`${RULE_ID}: a title fails even when the aria-label that names the link contains the label`, () => {
  const rule = assertRule(
    run('<a href="/c" aria-label="Contact, nouvelle fenêtre" title="Nouvelle fenêtre">Contact</a>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
  assert.equal(rule.occurrences[0].i18n.params.sources, 'title');
});

test(`${RULE_ID}: an accessible name that does not contain the visible label fails as the name`, () => {
  for (const body of [
    '<a href="/c" aria-label="Nous écrire">Contact</a>',
    '<span id="r">Plan du site</span><span role="link" tabindex="0" aria-labelledby="r">Accès rapide</span>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'linkLabelInNameSources_summary_fail_name');
  }
});

test(`${RULE_ID}: punctuation and capital letters are ignored, accents are not`, () => {
  for (const body of [
    '<a href="/c" title="contact!">Contact</a>',
    '<a href="/c" title="CONTACT - nouvelle fenêtre">Contact</a>',
    '<a href="/c" aria-label="Email">E-mail</a>',
    '<a href="/d" title="Déposer une annonce">Déposer</a>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const rule = assertRule(
    run('<a href="/d" title="Deposer une annonce">Déposer</a>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
});

test(`${RULE_ID}: the visible label's words must be adjacent in the source`, () => {
  const rule = assertRule(
    run('<a href="/c" title="Commander le produit X maintenant">Commander maintenant</a>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'SOURCE_LACKS_VISIBLE_LABEL']]);
  assertRule(
    run('<a href="/c" title="Produit X : commander maintenant">Commander maintenant</a>'),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a possible symbol, an abbreviation or text in parentheses is asked about`, () => {
  const cases = [
    ['<a href="/" aria-label="Fermer le menu">X</a>', 'POSSIBLE_SYMBOL', 'cantTell_symbol'],
    [
      '<a href="/p" title="Plan de l’avenue Foch">Plan de l’av. Foch</a>',
      'POSSIBLE_ABBREVIATION',
      'cantTell_nearMatch'
    ],
    [
      '<a href="/r.pdf" title="Rapport annuel">Rapport annuel (PDF)</a>',
      'PARENTHESISED_TEXT_MISSING',
      'cantTell_nearMatch'
    ]
  ];
  for (const [body, code, key] of cases) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['cantTell', code]], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.i18n.summaryKey, `linkLabelInNameSources_summary_${key}`);
    assert.equal(occ.uncertainty.code, 'equivalence-unknown');
  }
});

test(`${RULE_ID}: a sure failure and a question on one page give fail with both`, () => {
  const rule = assertRule(
    run('<a href="/c" title="Écrire">Contact</a><a href="/" aria-label="Fermer">X</a>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [
    ['fail', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['cantTell', 'POSSIBLE_SYMBOL']
  ]);
});

test(`${RULE_ID}: links with no other source, no visible text, SVG links and non-links are not applicable`, () => {
  for (const body of [
    '<a href="/c">Contact</a>',
    '<a href="/" title="Accueil"><img src="a.png" alt="Accueil"></a>',
    '<a href="/c" title="Écrire" hidden>Contact</a>',
    '<a title="Écrire">Contact</a>',
    '<svg><a href="/x" aria-label="Suite"><text>Autre</text></a></svg>',
    '<button aria-label="Fermer">Valider</button>',
    '<a href="/c" role="button" aria-label="Fermer">Valider</a>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const LINK_PAGE = page('<a href="/c" title="Ouvre une nouvelle fenêtre">Contact</a>');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(LINK_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 6.1 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-6.1' } } }
  ]) {
    const result = runa11yCoreOnHtml(LINK_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 6.1.5, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['6.1.5']);
  assert.deepEqual(map['label-in-name'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-6.1'), wcag: outcome('wcag-2.5.3-label-in-name'), result };
}

test(`${RULE_ID}: a title without the link text is outside WCAG 2.5.3 but fails RGAA 6.1`, () => {
  const r = rollups('<a href="/c" title="Ouvre une nouvelle fenêtre">Contact</a>');
  assert.equal(r.wcag, 'notApplicable');
  assert.equal(r.rgaa, 'fail');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-6.1');
  assert.ok(!rgaa.data.details.checksIds.includes('label-in-name'));
});

test(`${RULE_ID}: WCAG passes a name that drops the parenthesised text, RGAA asks`, () => {
  const r = rollups('<a href="/r.pdf" aria-label="Rapport">Rapport (PDF)</a>');
  assert.equal(r.wcag, 'pass');
  assert.equal(r.rgaa, 'cantTell');
});

test(`${RULE_ID}: WCAG asks about a hyphenation difference, RGAA ignores punctuation and passes`, () => {
  const r = rollups('<a href="/m" aria-label="Email">E-mail</a>');
  assert.equal(r.wcag, 'cantTell');
  assert.equal(r.rgaa, 'pass');
});

test(`${RULE_ID}: WCAG and RGAA agree on a replaced name and on a name that contains the label`, () => {
  const bad = rollups('<a href="/c" aria-label="Nous écrire">Contact</a>');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<a href="/c" aria-label="Contact, nouvelle fenêtre">Contact</a>');
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-label-in-name-sources-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-label-in-name-sources-all-scenarios.html'
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
    ['lins_case_01', 'fail', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['lins_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['lins_case_03', 'fail', 'SOURCE_LACKS_VISIBLE_LABEL'],
    ['lins_case_04', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['lins_case_05', 'cantTell', 'POSSIBLE_SYMBOL'],
    ['lins_case_06', 'cantTell', 'POSSIBLE_ABBREVIATION'],
    ['lins_case_07', 'cantTell', 'PARENTHESISED_TEXT_MISSING']
  ]);
});
