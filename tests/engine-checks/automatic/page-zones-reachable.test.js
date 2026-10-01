'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../src/coverage/rgaa-rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-zones-reachable';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const MAIN = '<main><h1>Titre</h1><p>Texte</p></main>';

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}
const run = (body, extra = {}) => runa11yCoreOnHtml(page(body), { ...RUN, ...extra });
const reasons = (rule) =>
  rule.occurrences.map((o) => [o.data.details.zone, o.data.details.reasonCode]);

test(`${RULE_ID}: every area with a matching landmark passes`, () => {
  assertRule(
    run(
      '<header><a href="/">Logo</a></header><nav><a href="/a">A</a></nav>' +
        MAIN +
        '<form role="search"><input type="search" aria-label="q"></form><footer>Mentions</footer>'
    ),
    RULE_ID,
    'pass'
  );
  assertRule(run('<search><input type="search" aria-label="q"></search>' + MAIN), RULE_ID, 'pass');
});

test(`${RULE_ID}: an area found from its name is asked about, with the mechanism it relies on`, () => {
  for (const [body, expected] of [
    ['<div class="header"><a href="/">Logo</a></div>', [['header', 'ZONE_NO_MECHANISM']]],
    ['<div id="site-footer"><h2>Informations</h2><p>Texte</p></div>', [['footer', 'ZONE_HEADING']]],
    [
      '<a href="#suite">Passer</a><div class="menu"><a href="/a">A</a></div><p id="suite">x</p>',
      [['navigation', 'ZONE_SKIP_LINK']]
    ],
    [
      '<button aria-controls="nav1" aria-expanded="true">Menu</button><div id="nav1" class="navbar"><a href="/a">A</a></div>',
      [['navigation', 'ZONE_TOGGLE']]
    ],
    [
      '<a href="#pied">Aller au pied de page</a><p>Texte</p><div id="pied" class="pied-de-page">Contact</div>',
      [['footer', 'ZONE_QUICK_LINK']]
    ],
    ['<form><input type="text" name="q" aria-label="q"></form>', [['search', 'ZONE_NO_MECHANISM']]]
  ]) {
    const rule = assertRule(run(body + MAIN), RULE_ID, 'cantTell');
    assert.deepEqual(reasons(rule), expected, body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a name inside or around a landmark of the same kind is that landmark`, () => {
  assertRule(
    run(
      '<header class="header"><div class="site-header">Logo</div></header><nav><ul class="menu"><li>x</li></ul></nav>' +
        MAIN
    ),
    RULE_ID,
    'pass'
  );
  assertRule(run('<div class="footer"><footer>Mentions</footer></div>' + MAIN), RULE_ID, 'pass');
});

test(`${RULE_ID}: a <header> inside an article is not the page header, and its name is not read`, () => {
  assertRule(
    run('<article><header class="entry-header"><h2>x</h2></header></article>' + MAIN),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a page with no main landmark is asked about`, () => {
  const rule = assertRule(run('<div><p>Texte</p></div>'), RULE_ID, 'cantTell');
  assert.deepEqual(reasons(rule), [['main', 'MAIN_NOT_FOUND']]);
  // A block named as the main content is asked about instead.
  const named = assertRule(run('<div id="content"><p>Texte</p></div>'), RULE_ID, 'cantTell');
  assert.deepEqual(reasons(named), [['main', 'ZONE_NO_MECHANISM']]);
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run('<div class="header">Logo</div>' + MAIN, { engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.match(rule.occurrences[0].summary, /^Cette zone \(« header »\) n’a ni rôle landmark/);
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(MAIN), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

// WCAG 2.4.1 needs one bypass mechanism for the page; RGAA 12.6.1 one per area.
test(`${RULE_ID}: WCAG 2.4.1 finds a bypass in <main>, RGAA 12.6 asks about the unmarked header`, () => {
  const result = runa11yCoreOnHtml(page('<div class="header">Logo</div>' + MAIN), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
  assert.notEqual(rollup('wcag-2.4.1-bypass-blocks').outcome, 'cantTell');
  assert.equal(rollup('rgaa-4.1.2-12.6').outcome, 'cantTell');
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['12.6.1']);
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2']['bypass-blocks-present'].tests, []);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['pzr_case_01', 'pzr_case_02', 'pzr_case_03', 'pzr_case_06']);
});
