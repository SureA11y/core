'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'skip-link-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}

function run(body, extra = {}) {
  return runa11yCoreOnHtml(page(body), { ...RUN, ...extra });
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

const NAV = '<header><nav><a href="/">Accueil</a><a href="/contact">Contact</a></nav></header>';
const MAIN = '<main id="main"><h1>Titre</h1><p>Contenu</p></main>';

test(`${RULE_ID}: navigation before main and no link to it fails`, () => {
  const rule = assertRule(run(NAV + MAIN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(reasons(rule), [['fail', 'noSkipLink']]);
  assert.match(occ.html, /^<main/);
  assert.equal(occ.data.details.navigationCount, 1);
  assert.equal(occ.i18n.summaryKey, 'skipLinkPresent_summary_fail_noLink');
});

test(`${RULE_ID}: a link to main, inside it or just before it passes`, () => {
  for (const body of [
    '<a href="#main">Aller au contenu</a>' + NAV + MAIN,
    '<a href="#t">Aller au contenu</a>' + NAV + '<main><h1 id="t">Titre</h1><p>x</p></main>',
    '<a href="#c">Aller au contenu</a>' + NAV + '<a id="c"></a><main><p>x</p></main>',
    '<a href="#c">Contenu</a>' + NAV + '<div id="c"><h1>Titre</h1><main><p>x</p></main></div>',
    NAV.replace('</nav>', '<a href="#main">Contenu</a></nav>') + MAIN,
    '<a href="#main">Aller au contenu</a>' + NAV + '<div role="main" id="main"><p>x</p></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a skip link whose target does not exist fails, with or without navigation`, () => {
  for (const body of [
    '<a href="#nope">Aller au contenu</a>' + NAV + MAIN,
    '<a href="#contenu">Aller au contenu</a><main><p>x</p></main>',
    '<a href="#inhalt">Zum Inhalt springen</a>' + NAV + MAIN,
    '<a href="#contenido">Saltar al contenido</a>' + NAV + MAIN,
    '<a href="#honbun">本文へスキップ</a>' + NAV + MAIN,
    // The page's first link, before main, is a skip link whatever its wording.
    '<a href="#x">Menu</a>' + NAV + MAIN
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'skipLinkTargetMissing']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'skipLinkPresent_summary_fail_targetMissing');
  }
});

test(`${RULE_ID}: an ordinary link to a missing id is not a skip link`, () => {
  const rule = assertRule(
    run(NAV + '<main><p>x</p><a href="#note">note</a></main><a href="#footer">Mentions</a>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'noSkipLink']]);
});

test(`${RULE_ID}: a skip link that stops short of main, or to a hidden target, is asked about`, () => {
  const short = assertRule(
    run(
      '<a href="#s">Aller à la recherche</a>' +
        NAV +
        '<form id="s"><input aria-label="Rechercher"></form>' +
        MAIN
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(short), [['cantTell', 'skipLinkTargetNotMain']]);
  assert.equal(
    short.occurrences[0].i18n.summaryKey,
    'skipLinkPresent_summary_cantTell_targetNotMain'
  );
  assert.equal(short.occurrences[0].uncertainty.code, 'judgement-required');

  const hidden = assertRule(
    run('<a href="#h">Aller au contenu</a>' + NAV + '<div id="h" hidden></div>' + MAIN),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(hidden), [['cantTell', 'skipLinkTargetHidden']]);
});

// A target inside navigation, after main, or with navigation between it and
// main leads elsewhere.
test(`${RULE_ID}: a skip link that leads to navigation or past main does not count`, () => {
  for (const body of [
    '<a href="#menu">Aller au menu</a><nav id="menu"><a href="/">A</a></nav>' + MAIN,
    '<a href="#top">Aller au contenu</a><div id="top">' + NAV + '</div>' + MAIN,
    '<a href="#pied">Aller au pied de page</a>' + NAV + MAIN + '<footer id="pied">f</footer>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'noSkipLink']], body);
  }
});

test(`${RULE_ID}: a link inside main, or to a point deep in main, does not lead to main`, () => {
  const rule = assertRule(
    run(
      NAV +
        '<a href="#s2">Section 2</a>' +
        '<main><a href="#s2">Section 2</a><h2 id="s2">Section 2</h2></main>'
    ),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'noSkipLink']]);
});

test(`${RULE_ID}: without navigation before main, a missing link is asked about`, () => {
  for (const body of [
    '<p>Intro <a href="/x">x</a></p><main><p>x</p></main>',
    '<main><p>x</p></main><nav><a href="/">A</a></nav>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', 'noNavigationBeforeMain']], body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'skipLinkPresent_summary_cantTell_noNavigation'
    );
  }
});

test(`${RULE_ID}: without main, a page with links is asked about and a page without is not applicable`, () => {
  const rule = assertRule(run(NAV + '<div><p>x</p></div>'), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), [['cantTell', 'mainNotFound']]);
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'skipLinkPresent_summary_cantTell_noMain');
  assertRule(run('<p>Texte</p>'), RULE_ID, 'notApplicable');
  // A hidden <main> is not the zone.
  assertRule(run('<p>Texte</p><main hidden><p>x</p></main>'), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: a run scoped to part of the page is not applicable`, () => {
  assertRule(run(NAV + MAIN, { contextSelector: 'main' }), RULE_ID, 'notApplicable');
  assertRule(run(NAV + MAIN, { engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page(NAV + MAIN);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 12.7 rollup id run it`, () => {
  const html = page(NAV + MAIN);
  for (const opts of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-12.7' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

function rgaaRun(body) {
  const result = runa11yCoreOnHtml(page(body), { engineOptions: { profile: 'rgaa-4.1.2' } });
  const rollup = (prefix) => result.rulesResults.find((r) => r.ruleId.startsWith(prefix));
  const rule = (id) => result.checksResults.find((r) => r.ruleId === id);
  return { rollup, rule };
}

// WCAG 2.4.1 accepts the main landmark; RGAA 12.7.1 needs a link.
test(`${RULE_ID}: a main landmark satisfies WCAG 2.4.1 but not RGAA 12.7`, () => {
  const { rollup, rule } = rgaaRun(NAV + MAIN);
  assert.equal(rule('bypass-blocks-present').outcome, 'notApplicable');
  assert.equal(rollup('wcag-2.4.1-').outcome, 'notApplicable');
  const rgaa127 = rollup('rgaa-4.1.2-12.7');
  assert.equal(rgaa127.outcome, 'fail');
  assert.deepEqual(
    rgaa127.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['12.7.1']
  );
  // bypass-blocks-present links no RGAA test: page-zones-reachable reports 12.6.1.
  assert.deepEqual(rule('bypass-blocks-present').rollupIds, ['wcag-2.4.1-bypass-blocks']);
  assert.ok(!rgaa127.data.details.checksIds.includes('bypass-blocks-present'));
});

// 12.7.1 passes here. 12.7 as a whole stays a question: skip-link-placement
// asks about 12.7.2 (visibility needs a browser, place needs other pages).
test(`${RULE_ID}: with a skip link to main, WCAG finds a bypass and RGAA 12.7.1 passes`, () => {
  const { rule, rollup } = rgaaRun('<a href="#main">Aller au contenu</a>' + NAV + MAIN);
  assert.equal(rollup('wcag-2.4.1-').outcome, 'notApplicable');
  assert.equal(rule(RULE_ID).outcome, 'pass');
  const rgaa127 = rollup('rgaa-4.1.2-12.7');
  assert.equal(rgaa127.outcome, 'cantTell');
  assert.deepEqual(
    rgaa127.data.details.contributors.filter((c) => c.outcome === 'cantTell').map((c) => c.testId),
    ['skip-link-placement']
  );
});

test(`${RULE_ID}: with no main, no heading and no anchor, both ask`, () => {
  const { rollup } = rgaaRun(NAV + '<div><p>Texte</p></div>');
  assert.equal(rollup('wcag-2.4.1-').outcome, 'cantTell');
  assert.equal(rollup('rgaa-4.1.2-12.7').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/skip-link-present-all-scenarios.html)`, () => {
  // Whole-document rule: the fixture shows the fail case; the other branches
  // are the inline tests above.
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'skip-link-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepEqual(reasons(rule), [['fail', 'skipLinkTargetMissing']]);
  assert.match(rule.occurrences[0].html, /id="slp_case_01"/);
});
