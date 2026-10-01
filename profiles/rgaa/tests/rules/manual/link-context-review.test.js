'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-context-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, lang = 'fr') {
  return `<!doctype html><html lang="${lang}"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function run(body, lang) {
  return runa11yCoreOnHtml(page(body, lang), RUN);
}

function reasons(rule) {
  return rule.occurrences.map((o) => o.data.details.reasonCode);
}

test(`${RULE_ID}: a generic link whose only context is an aria-describedby text is asked about`, () => {
  const rule = assertRule(
    run(
      '<div><a href="/r" aria-describedby="d">En savoir plus</a><span id="d">sur le rapport 2025</span></div>'
    ),
    RULE_ID,
    'cantTell',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), ['DESCRIBEDBY_CONTEXT_ONLY']);
  const occ = rule.occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'linkContextReview_summary_cantTell_describedBy');
  assert.equal(occ.i18n.hintKey, 'linkContextReview_hint_cantTell');
  assert.equal(occ.data.details.context, 'sur le rapport 2025');
  assert.equal(occ.uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: a generic link whose only context is a dd, dt, blockquote or figcaption is asked about`, () => {
  for (const [body, container] of [
    ['<dl><dt>Rapport</dt><dd>Le rapport annuel : <a href="/r">en savoir plus</a></dd></dl>', 'dd'],
    ['<dl><dt>Le rapport annuel <a href="/r">ici</a></dt><dd>x</dd></dl>', 'dt'],
    [
      '<blockquote>Une citation du rapport <a href="/r">lire la suite</a></blockquote>',
      'blockquote'
    ],
    [
      '<figure><figcaption>Graphique des ventes <a href="/g.pdf">PDF</a></figcaption></figure>',
      'figcaption'
    ]
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), ['CONTAINER_CONTEXT_ONLY'], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.container, container);
    assert.equal(occ.i18n.summaryKey, 'linkContextReview_summary_cantTell_container');
    assert.equal(occ.i18n.params.element, container);
  }
});

test(`${RULE_ID}: context RGAA lists, no context at all, and descriptive links are not applicable`, () => {
  for (const body of [
    '<p>Rapport 2025 : <a href="/r">en savoir plus</a></p>',
    '<ul><li>Rapport 2025 : <a href="/r">en savoir plus</a></li></ul>',
    '<table><tr><td>Rapport 2025 <a href="/r">en savoir plus</a></td></tr></table>',
    '<table><tr><th>Rapport 2025</th></tr><tr><td><a href="/r.pdf">PDF</a></td></tr></table>',
    '<p>Rapport <a href="/r" aria-describedby="d">lire la suite</a><span id="d">du rapport</span></p>',
    '<div><a href="/r">en savoir plus</a></div>',
    '<div><a href="/r" aria-describedby="d">Rapport annuel 2025</a><span id="d">PDF</span></div>',
    '<div><a href="/r" aria-describedby="d" hidden>En savoir plus</a><span id="d">sur le rapport</span></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a phrase is generic only in English or in the link's own language`, () => {
  const body =
    '<div><a href="/r" aria-describedby="d">Plus</a><span id="d">sur le rapport 2025</span></div>';
  assertRule(run(body, 'fr'), RULE_ID, 'cantTell');
  assertRule(run(body, 'en'), RULE_ID, 'notApplicable');
});

// --- opt-in gate -------------------------------------------------------------

const PAGE = page(
  '<div><a href="/r" aria-describedby="d">En savoir plus</a><span id="d">sur le rapport 2025</span></div>'
);

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions });
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
    const result = runa11yCoreOnHtml(PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 6.1.1 to 6.1.4, and link-name-quality keeps them`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  const tests = ['6.1.1', '6.1.2', '6.1.3', '6.1.4'];
  assert.deepEqual(map[RULE_ID].tests, tests);
  assert.deepEqual(map['link-name-quality'].tests, tests);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-6.1'), wcag: outcome('wcag-2.4.4-link-purpose-in-context') };
}

test(`${RULE_ID}: WCAG passes a generic link with aria-describedby context, RGAA 6.1 asks`, () => {
  const r = rollups(
    '<div><a href="/r" aria-describedby="d">En savoir plus</a><span id="d">sur le rapport 2025</span></div>'
  );
  assert.equal(r.wcag, 'pass');
  assert.equal(r.rgaa, 'cantTell');
});

test(`${RULE_ID}: WCAG and RGAA agree on a link with paragraph context and on one with none`, () => {
  const good = rollups('<p>Rapport 2025 : <a href="/r">en savoir plus</a></p>');
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'notApplicable');
  const bare = rollups('<div><a href="/r">en savoir plus</a></div>');
  assert.equal(bare.wcag, 'cantTell');
  assert.equal(bare.rgaa, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-context-review-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-context-review-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['lcr_case_01', 'DESCRIBEDBY_CONTEXT_ONLY'],
    ['lcr_case_02', 'CONTAINER_CONTEXT_ONLY'],
    ['lcr_case_03', 'CONTAINER_CONTEXT_ONLY']
  ]);
});
