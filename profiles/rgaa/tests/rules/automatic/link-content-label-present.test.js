'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-content-label-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a link named only by an attribute fails, naming the source`, () => {
  for (const [body, source] of [
    ['<a href="/" aria-label="Accueil"><svg aria-hidden="true"></svg></a>', 'aria-label'],
    ['<a href="/" title="Accueil"><img src="i.png" alt=""></a>', 'title'],
    ['<a href="/" aria-labelledby="l"></a><span id="l">Accueil</span>', 'aria-labelledby'],
    ['<span role="link" tabindex="0" aria-label="Plan du site"></span>', 'aria-label']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'nameOutsideContent', body);
    assert.equal(occ.data.details.nameSource, source, body);
    assert.equal(occ.i18n.summaryKey, 'linkContentLabelPresent_summary_fail_nameOutsideContent');
    assert.deepEqual(occ.i18n.params, { source });
  }
});

test(`${RULE_ID}: a link with no label at all fails`, () => {
  for (const body of [
    '<a href="/"></a>',
    '<a href="/"><img src="i.png"></a>',
    '<a href="/"><span aria-hidden="true">Accueil</span></a>',
    '<a href="/"><span style="display:none">Accueil</span></a>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'noContentLabel', body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'linkContentLabelPresent_summary_fail_noLabel'
    );
  }
});

test(`${RULE_ID}: content that is not plain text is asked about`, () => {
  for (const body of [
    '<a href="/aide" aria-label="Aide"><span aria-hidden="true">?</span></a>',
    '<a href="/"><span aria-label="Accueil"></span></a>',
    '<a href="/"><video src="v.mp4"></video></a>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'contentNotReadable', body);
    assert.equal(
      occ.i18n.summaryKey,
      'linkContentLabelPresent_summary_cantTell_contentNotReadable'
    );
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: text or an image text alternative in the content passes`, () => {
  for (const body of [
    '<a href="/">Accueil</a>',
    '<a href="/" aria-label="Retour à l’accueil">Accueil</a>',
    '<a href="/"><img src="logo.png" alt="Accueil"></a>',
    '<a href="/"><img src="logo.png" alt="" aria-label="Accueil"></a>',
    '<a href="/"><svg role="img" aria-label="Accueil"></svg></a>',
    '<a href="/"><svg><title>Accueil</title></svg></a>',
    '<a href="/"><span class="sr-only" style="position:absolute;clip:rect(0 0 0 0)">Accueil</span></a>',
    '<a href="/"><img src="i.png" alt="">Accueil</a>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: area, anchors without href and links with another widget role are not applicable`, () => {
  assertRule(
    run(
      '<img src="m.png" alt="Plan" usemap="#m"><map name="m"><area href="/a" shape="rect" coords="0,0,1,1"></map>' +
        '<a name="top"></a><a href="#x" role="button"></a>'
    ),
    RULE_ID,
    'notApplicable'
  );
  // A focusable link keeps its role under role="presentation".
  assertRule(run('<a href="/" role="presentation"></a>'), RULE_ID, 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: a link outside the accessibility tree is not applicable`, () => {
  assertRule(
    run('<a href="/" style="display:none"></a><div hidden><a href="/"></a></div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<main><a href="/" aria-label="Accueil"></a></main>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 6.2 rollup id run it`, () => {
  const html = page('<main><a href="/" aria-label="Accueil"></a></main>');
  for (const opts of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-6.2' } } }
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

test(`${RULE_ID}: an aria-label-only link fails 6.2 under RGAA while WCAG 2.4.4 passes`, () => {
  const { rollup, rule } = rgaaRun(
    '<main><h1>T</h1><a href="/" aria-label="Accueil"><svg aria-hidden="true"></svg></a></main>'
  );
  assert.equal(rule('link-name-present').outcome, 'pass');
  assert.equal(rollup('wcag-2.4.4-').outcome, 'pass');
  const rgaa62 = rollup('rgaa-4.1.2-6.2');
  assert.equal(rgaa62.outcome, 'fail');
  assert.deepEqual(rgaa62.data.details.checksIds, [RULE_ID]);
});

// link-name-present fails an unnamed <area>; RGAA judges it under 1.1.2.
test(`${RULE_ID}: an unnamed area fails WCAG 2.4.4 and RGAA 1.1, not RGAA 6.2`, () => {
  const { rollup, rule } = rgaaRun(
    '<img src="m.png" alt="Plan" usemap="#m"><map name="m"><area href="/a" shape="rect" coords="0,0,1,1"></map><main><h1>T</h1></main>'
  );
  assert.equal(rule('link-name-present').outcome, 'fail');
  assert.equal(rollup('wcag-2.4.4-').outcome, 'fail');
  assert.equal(rollup('rgaa-4.1.2-6.2').outcome, 'notApplicable');
  assert.equal(rollup('rgaa-4.1.2-1.1').outcome, 'fail');
  assert.deepEqual(rule('link-name-present').rollupIds, [
    'wcag-2.4.4-link-purpose-in-context',
    'wcag-4.1.2-name'
  ]);
});

test(`${RULE_ID}: both fail an empty link and both pass a text link`, () => {
  const empty = rgaaRun('<main><h1>T</h1><a href="/"></a></main>');
  assert.equal(empty.rollup('wcag-2.4.4-').outcome, 'fail');
  assert.equal(empty.rollup('rgaa-4.1.2-6.2').outcome, 'fail');
  const text = rgaaRun('<main><h1>T</h1><a href="/">Accueil</a></main>');
  assert.equal(text.rollup('wcag-2.4.4-').outcome, 'pass');
  assert.equal(text.rollup('rgaa-4.1.2-6.2').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-content-label-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-content-label-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'lcl_case_01',
    'lcl_case_02',
    'lcl_case_03',
    'lcl_case_04',
    'lcl_case_05'
  ]);
  assert.deepEqual(reasons(rule), [
    ['fail', 'nameOutsideContent'],
    ['fail', 'nameOutsideContent'],
    ['fail', 'noContentLabel'],
    ['fail', 'nameOutsideContent'],
    ['cantTell', 'contentNotReadable']
  ]);
});
