'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-title-unique';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const HERE = 'https://example.test/horaires';

function page(title) {
  return `<!doctype html><html lang="fr"><head>${title == null ? '' : `<title>${title}</title>`}</head><body><p>Texte</p></body></html>`;
}
function run(title, pages, engineOptions = {}) {
  return runa11yCoreOnHtml(page(title), {
    ...RUN,
    url: HERE,
    engineOptions: {
      ...engineOptions,
      ...(pages ? { probes: { 'crawl.pageTitles': { pages } } } : {})
    }
  });
}
const reasons = (rule) =>
  rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);

test(`${RULE_ID}: another page at another path with the same title fails`, () => {
  const rule = assertRule(
    run('Horaires – Médiathèque', [
      { url: 'https://example.test/contact', title: '  horaires –  MÉDIATHÈQUE ' },
      { url: 'https://example.test/', title: 'Accueil – Médiathèque' }
    ]),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), [['fail', 'TITLE_DUPLICATE']]);
  const occ = rule.occurrences[0];
  assert.equal(occ.selector, 'head > title');
  assert.deepEqual(occ.data.details.pages, ['https://example.test/contact']);
  assert.match(occ.summary, /« de manière claire, concise et unique »/);
  assert.equal(occ.i18n.summaryKey, 'pageTitleUnique_summary_fail_duplicate');
});

test(`${RULE_ID}: the same title at the same path with another query string is asked about`, () => {
  const rule = assertRule(
    run('Résultats', [{ url: HERE + '/?page=2', title: 'Résultats' }]),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'TITLE_DUPLICATE_SAME_PATH']]);
  assert.equal(rule.occurrences[0].uncertainty.code, 'equivalence-unknown');
});

test(`${RULE_ID}: the page's own entry is left out, and with no other page the title is asked about`, () => {
  for (const pages of [
    null,
    [],
    [{ url: HERE + '#top', title: 'Horaires' }],
    [{ url: '/x', title: '' }]
  ]) {
    const rule = assertRule(run('Horaires', pages), RULE_ID, 'cantTell');
    assert.deepEqual(reasons(rule), [['cantTell', 'TITLE_SINGLE_PAGE']], JSON.stringify(pages));
    assert.equal(rule.occurrences[0].uncertainty.code, 'out-of-scope');
  }
});

test(`${RULE_ID}: a title no other page shares passes, and the record is returned`, () => {
  const rule = assertRule(
    run('Horaires – Médiathèque', [
      { url: 'https://example.test/contact', title: 'Contact – Médiathèque' }
    ]),
    RULE_ID,
    'pass'
  );
  assert.deepEqual(rule.data.page, { url: HERE, title: 'Horaires – Médiathèque' });
});

test(`${RULE_ID}: no title, or an empty one, is page-title-present's and notApplicable here`, () => {
  for (const title of [null, '', '   ']) {
    assertRule(run(title, []), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: messages follow the scan locale and keep the glossary's words`, () => {
  const rule = assertRule(
    run('Horaires', [{ url: 'https://example.test/b', title: 'Horaires' }], { locale: 'de' }),
    RULE_ID,
    'fail'
  );
  assert.match(rule.occurrences[0].summary, /^Andere Seiten der Website haben denselben Titel/);
  assert.match(rule.occurrences[0].summary, /« de manière claire, concise et unique »/);
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('Horaires'), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: WCAG 2.4.2 does not fail a duplicated title, RGAA 8.6 does`, () => {
  const result = runa11yCoreOnHtml(page('Horaires – Médiathèque'), {
    url: HERE,
    engineOptions: {
      profile: 'rgaa-4.1.2',
      probes: {
        'crawl.pageTitles': {
          pages: [{ url: 'https://example.test/b', title: 'Horaires – Médiathèque' }]
        }
      }
    }
  });
  const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id).outcome;
  assert.notEqual(rollup('wcag-2.4.2-page-titled'), 'fail');
  assert.equal(rollup('rgaa-4.1.2-8.6'), 'fail');
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['8.6.1']);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  // Whole-document rule: scanned alone, the fixture's title is asked about.
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', { maxOccurrences: 1 });
  assert.deepEqual(reasons(rule), [['cantTell', 'TITLE_SINGLE_PAGE']]);
});
