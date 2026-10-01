'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../profiles/rgaa/rule-map.js');
const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

// jsdom has no layout, so visibility and place are always asked about here;
// skip-link-placement-chromium.test.js checks the verdicts a browser gives.
const RULE_ID = 'skip-link-placement';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const URL_A = 'https://example.test/a';

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}
const SKIP = '<a href="#main">Aller au contenu</a>';
const NAV = '<nav><a href="/a">A</a> <a href="/b">B</a></nav>';
const MAIN = '<main id="main"><h1>Titre</h1><p>Texte</p></main>';

function run(body, engineOptions = {}, url = URL_A) {
  return runa11yCoreOnHtml(page(body), { ...RUN, url, engineOptions });
}
const check = (result) => result.checksResults.find((r) => r.ruleId === RULE_ID);
const reasons = (rule) =>
  rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);

test(`${RULE_ID}: a page without a skip link is notApplicable, and says so in its record`, () => {
  const rule = assertRule(run(NAV + MAIN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  assert.deepEqual(rule.data.page, {
    url: URL_A,
    viewportWidth: rule.data.page.viewportWidth,
    skipLink: null
  });
});

test(`${RULE_ID}: a link that does not reach the main content is not a skip link here`, () => {
  assertRule(
    run('<a href="#nowhere">Aller au contenu</a>' + NAV + MAIN),
    RULE_ID,
    'notApplicable',
    {
      maxOccurrences: 0
    }
  );
});

test(`${RULE_ID}: without a layout, visibility and place are asked about`, () => {
  const rule = assertRule(run(SKIP + NAV + MAIN), RULE_ID, 'cantTell', { minOccurrences: 2 });
  assert.deepEqual(reasons(rule), [
    ['cantTell', 'SKIP_LINK_VISIBILITY_UNKNOWN'],
    ['cantTell', 'SKIP_LINK_SINGLE_PAGE']
  ]);
  assert.equal(rule.occurrences[0].data.details.cause, 'noLayout');
  assert.equal(rule.occurrences[0].uncertainty.code, 'not-computable');
  assert.equal(rule.occurrences[1].uncertainty.code, 'out-of-scope');
  assert.deepEqual(rule.data.page.skipLink, {
    text: 'Aller au contenu',
    href: '#main',
    focusOrder: 0,
    x: null,
    y: null,
    width: null,
    height: null
  });
});

test(`${RULE_ID}: the probe's own page is left out, and another page in another focus order is asked about`, () => {
  const probe = (pages) => ({ probes: { 'crawl.skipLinks': { pages } } });
  const same = check(
    run(SKIP + NAV + MAIN, probe([{ url: URL_A + '#x', skipLink: { focusOrder: 3, x: null } }]))
  );
  assert.ok(reasons(same).some(([, r]) => r === 'SKIP_LINK_SINGLE_PAGE'));

  const other = check(
    run(
      SKIP + NAV + MAIN,
      probe([
        { url: 'https://example.test/b', skipLink: { focusOrder: 2 } },
        { url: 'https://example.test/c', skipLink: null }
      ])
    )
  );
  const order = other.occurrences.find(
    (o) => o.data.details.reasonCode === 'SKIP_LINK_ORDER_DIFFERS'
  );
  assert.equal(order.occurrenceOutcome, 'cantTell');
  assert.equal(order.i18n.params.pages, 'https://example.test/b');
  assert.ok(!reasons(other).some(([, r]) => r === 'SKIP_LINK_SINGLE_PAGE'));
});

test(`${RULE_ID}: positive tabindex counts first in the focus order`, () => {
  const rule = check(run('<button tabindex="1">Menu</button>' + SKIP + NAV + MAIN));
  assert.equal(rule.data.page.skipLink.focusOrder, 1);
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = check(run(SKIP + NAV + MAIN, { locale: 'fr' }));
  const single = rule.occurrences.find(
    (o) => o.data.details.reasonCode === 'SKIP_LINK_SINGLE_PAGE'
  );
  assert.match(single.summary, /^Seule cette page était disponible/);
  assert.equal(
    rule.title,
    'Les liens d’évitement sont visibles et à la même place sur chaque page'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(SKIP + NAV + MAIN), { engineOptions });
    assert.ok(!check(result), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile and the 12.7 rollup run it, and the map links it to 12.7.2`, () => {
  const result = runa11yCoreOnHtml(page(SKIP + NAV + MAIN), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  assert.equal(check(result).outcome, 'cantTell');
  const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-12.7');
  assert.ok(rollup.data.details.contributors.some((c) => c.testId === RULE_ID));
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['12.7.2']);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  // Whole-document rule: the fixture shows one case. jsdom asks about it;
  // the Chromium test checks the same page in a browser.
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.ok(rule.occurrences.every((o) => /id="slp_case_01"/.test(o.html)));
});
