'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'frame-title-attribute-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a frame with a title attribute passes`, () => {
  const html = page('<iframe src="a.html" title="Carte"></iframe>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a frame with no title attribute fails`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<iframe id="f" src="a.html"></iframe>'), RUN),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'missingTitle');
  assert.equal(occ.i18n.summaryKey, 'frameTitleAttributePresent_summary_fail');
  assert.deepEqual(occ.i18n.params, { element: 'iframe' });
  assert.equal(occ.summary, 'This <iframe> has no title attribute.');
});

// RGAA 2.1.1 asks for the title attribute; an accessible name from ARIA does
// not replace it.
test(`${RULE_ID}: aria-label or aria-labelledby does not replace the title`, () => {
  for (const body of [
    '<iframe src="a.html" aria-label="Map"></iframe>',
    '<span id="l">Map</span><iframe src="a.html" aria-labelledby="l"></iframe>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', { minOccurrences: 1 });
  }
});

test(`${RULE_ID}: a frame out of the tab order is still checked`, () => {
  const html = page('<iframe src="a.html" tabindex="-1"></iframe>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { minOccurrences: 1 });
});

// An empty title is present: 2.1.1 passes and 2.2.1 (frame-title-not-empty)
// fails it.
test(`${RULE_ID}: an empty title attribute is present`, () => {
  const html = page('<iframe src="a.html" title=""></iframe>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
});

// Glossary "Titre de cadre", note 2: aria-hidden="true" makes 2.1 and 2.2
// not applicable.
test(`${RULE_ID}: aria-hidden="true" on the frame or an ancestor makes it not applicable`, () => {
  for (const body of [
    '<iframe src="a.html" aria-hidden="true"></iframe>',
    '<div aria-hidden="true"><iframe src="a.html"></iframe></div>',
    '<iframe src="a.html" style="display:none"></iframe>',
    '<p>No frame</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: <frame> elements are checked too`, () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head>' +
    '<frameset cols="50%,50%"><frame src="a.html" title="Menu"><frame src="b.html"></frameset></html>';
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.element, 'frame');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<iframe src="a.html"></iframe>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(rule.occurrences[0].summary, 'Ce cadre <iframe> n’a pas d’attribut title.');
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<iframe src="a.html" aria-label="Map"></iframe>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 2.1 rollup id run it`, () => {
  const html = page('<iframe src="a.html"></iframe>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-2.1' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// Under the RGAA profile, 2.1 takes this rule's verdict, while WCAG 4.1.2 in
// the same run keeps iframe-name-present's.
test(`${RULE_ID}: RGAA 2.1 and WCAG 4.1.2 disagree on a frame named by aria-label`, () => {
  const result = runa11yCoreOnHtml(page('<iframe src="a.html" aria-label="Map"></iframe>'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-2.1').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-name').outcome, 'pass');
  assert.deepEqual(rollup(result, 'rgaa-4.1.2-2.1').data.details.checksIds, [
    'frame-title-attribute-present'
  ]);
});

test(`${RULE_ID}: RGAA 2.1 and WCAG 4.1.2 agree on a frame with no name at all`, () => {
  const result = runa11yCoreOnHtml(page('<iframe src="a.html"></iframe>'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-2.1').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-name').outcome, 'fail');
  const titled = runa11yCoreOnHtml(page('<iframe src="a.html" title="Carte"></iframe>'), RGAA);
  assert.equal(rollup(titled, 'rgaa-4.1.2-2.1').outcome, 'pass');
  assert.equal(rollup(titled, 'wcag-4.1.2-name').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['fta_case_01', 'fta_case_02', 'fta_case_03', 'fta_case_04']);
});
