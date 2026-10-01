'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'main-element-structure';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

const HTML401 =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
const XHTML10 =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';

function page(body, doctype = '<!doctype html>') {
  return `${doctype}<html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

test(`${RULE_ID}: one <main> passes, and so do others that carry hidden`, () => {
  for (const body of [
    '<main><p>a</p></main>',
    '<main><p>a</p></main><main hidden><p>b</p></main>',
    '<main hidden><p>a</p></main><main><p>b</p></main><main hidden="until-found"><p>c</p></main>'
  ]) {
    assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 9.2.1 step 5: « les autres occurrences de l'élément sont pourvues d'un
// attribut hidden »; the 9.2 technical note: a style alone is not enough.
test(`${RULE_ID}: a second <main> without the hidden attribute fails, whatever hides it`, () => {
  for (const second of [
    '<main><p>b</p></main>',
    '<main aria-hidden="true"><p>b</p></main>',
    '<main style="display:none"><p>b</p></main>',
    '<main class="off"><p>b</p></main><style>.off{visibility:hidden}</style>'
  ]) {
    const rule = assertRule(run(page('<main id="m1"><p>a</p></main>' + second)), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.deepEqual(reasons(rule), ['extraMain']);
    assert.doesNotMatch(occ.html, /id="m1"/);
    assert.equal(occ.i18n.summaryKey, 'mainElementStructure_summary_fail_extraMain');
    assert.equal(occ.i18n.hintKey, 'mainElementStructure_hint_fail_extraMain');
  }
});

test(`${RULE_ID}: each extra <main> is reported`, () => {
  const html = page('<main>a</main><main>b</main><main hidden>c</main><main>d</main>');
  const rule = assertRule(run(html), RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(reasons(rule), ['extraMain', 'extraMain']);
});

// Step 4: « la zone de contenu principal est structurée au moyen d'un
// élément <main> ».
test(`${RULE_ID}: role="main" with no <main> element fails`, () => {
  const rule = assertRule(run(page('<div role="main"><p>a</p></div>')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), ['roleMainOnly']);
  assert.equal(
    rule.occurrences[0].summary,
    'The main content is marked with role="main" but the page has no <main> element.'
  );
});

test(`${RULE_ID}: a page with neither <main> nor role="main" is asked about`, () => {
  const rule = assertRule(run(page('<div><p>a</p></div>')), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), ['noMain']);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: a <main> hidden only by an ancestor is asked about`, () => {
  for (const second of [
    '<div hidden><main><p>b</p></main></div>',
    '<details><summary>More</summary><main><p>b</p></main></details>',
    '<dialog><main><p>b</p></main></dialog>'
  ]) {
    const rule = assertRule(run(page('<main><p>a</p></main>' + second)), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), ['hiddenByAncestor']);
  }
});

test(`${RULE_ID}: a page whose every <main> carries hidden is asked about`, () => {
  const rule = assertRule(run(page('<main hidden><p>a</p></main>')), RULE_ID, 'cantTell');
  assert.deepEqual(reasons(rule), ['allHidden']);
});

// 9.2 particular case: not applicable when the declared doctype is not HTML5.
test(`${RULE_ID}: a page without the HTML5 doctype is not applicable`, () => {
  for (const doctype of [HTML401, XHTML10, '']) {
    assertRule(run(page('<main>a</main><main>b</main>', doctype)), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  assertRule(
    run(page('<main>a</main><main>b</main>', '<!DOCTYPE html SYSTEM "about:legacy-compat">')),
    RULE_ID,
    'fail'
  );
});

test(`${RULE_ID}: a scoped or fragment run is not applicable`, () => {
  const html = page('<main>a</main><main>b</main>');
  assertRule(run(html, { ...RUN, contextSelector: 'main' }), RULE_ID, 'notApplicable');
  assertRule(run(html, { ...RUN, engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('<div role="main">a</div>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'La zone de contenu principal est indiquée par role="main", mais la page n’a pas de balise <main>.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('<div role="main">a</div>'), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 9.2 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-9.2' } } }
  ]) {
    const result = runa11yCoreOnHtml(page('<div role="main">a</div>'), opts);
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// The landmark rules are best practice, with no WCAG rollup; they are no
// longer linked to 9.2.1, so the RGAA profile does not run them, and a
// default run still gives their own verdict. Both only ask, so reporting
// nothing (notApplicable) is how they accept a page.
function landmarks(html) {
  const result = runa11yCoreOnHtml(html);
  const byId = (id) => result.checksResults.find((r) => r.ruleId === id);
  return {
    one: byId('landmark-one-main').outcome,
    duplicate: byId('landmark-no-duplicate-main').outcome
  };
}

test(`${RULE_ID}: RGAA 9.2 fails role="main" and a CSS-hidden duplicate that the landmark rules accept`, () => {
  const roleMain = page('<div role="main"><p>a</p></div>');
  assert.equal(rollup(runa11yCoreOnHtml(roleMain, RGAA), 'rgaa-4.1.2-9.2').outcome, 'fail');
  assert.equal(landmarks(roleMain).one, 'notApplicable');

  const cssHidden = page('<main><p>a</p></main><main style="display:none"><p>b</p></main>');
  const result = runa11yCoreOnHtml(cssHidden, RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-9.2').outcome, 'fail');
  assert.deepEqual(rollup(result, 'rgaa-4.1.2-9.2').data.details.checksIds, [RULE_ID]);
  assert.ok(!result.checksResults.some((r) => r.ruleId === 'landmark-no-duplicate-main'));
  assert.equal(landmarks(cssHidden).duplicate, 'notApplicable');
});

test(`${RULE_ID}: RGAA 9.2 is not applicable on HTML 4.01 where the landmark rule asks`, () => {
  const html = page('<main><p>a</p></main><main><p>b</p></main>', HTML401);
  assert.equal(rollup(runa11yCoreOnHtml(html, RGAA), 'rgaa-4.1.2-9.2').outcome, 'notApplicable');
  assert.equal(landmarks(html).duplicate, 'cantTell');
});

test(`${RULE_ID}: RGAA 9.2 and the landmark rules agree on one <main>, and both ask when there is none`, () => {
  const one = page('<main><p>a</p></main>');
  assert.equal(rollup(runa11yCoreOnHtml(one, RGAA), 'rgaa-4.1.2-9.2').outcome, 'pass');
  assert.equal(landmarks(one).one, 'notApplicable');
  assert.equal(landmarks(one).duplicate, 'notApplicable');
  const none = page('<div><p>a</p></div>');
  assert.equal(rollup(runa11yCoreOnHtml(none, RGAA), 'rgaa-4.1.2-9.2').outcome, 'cantTell');
  assert.equal(landmarks(none).one, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].html, /id="mes_main_2"/);
});
