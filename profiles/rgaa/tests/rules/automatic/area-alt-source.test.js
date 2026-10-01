'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'area-alt-source';
const WCAG_RULE = 'area-alt-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.1';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);
const map = (area, extra = '') =>
  `${extra}<img src="m.png" usemap="#m" alt="Carte" width="100" height="100"><map name="m">${area}</map>`;

test(`${RULE_ID}: an area named by alt or aria-label passes`, () => {
  for (const area of [
    '<area href="/a" coords="0,0,10,10" alt="Paris">',
    '<area href="/a" coords="0,0,10,10" aria-label="Paris">',
    '<area href="/a" coords="0,0,10,10" alt="Paris" title="Paris">'
  ]) {
    assertRule(run(map(area)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an area named only by title or aria-labelledby fails`, () => {
  for (const [area, sources] of [
    ['<area href="/a" coords="0,0,10,10" title="Paris">', ['title']],
    ['<area href="/a" coords="0,0,10,10" aria-labelledby="l">', ['aria-labelledby']],
    [
      '<area href="/a" coords="0,0,10,10" alt="" aria-labelledby="l" title="Lyon">',
      ['aria-labelledby', 'title']
    ]
  ]) {
    const rule = assertRule(run(map(area, '<p id="l">Lyon</p>')), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'unlistedNameSource', area);
    assert.deepEqual(occ.data.details.sources, sources, area);
    assert.deepEqual(occ.i18n.params, { sources: sources.join(', ') });
  }
});

test(`${RULE_ID}: unnamed, unused, unlinked and hidden areas are not applicable`, () => {
  for (const body of [
    map('<area href="/a" coords="0,0,10,10">'),
    map('<area href="/a" coords="0,0,10,10" aria-labelledby="missing">'),
    '<map name="u"><area href="/a" coords="0,0,10,10" title="Nice"></map>',
    map('<area coords="0,0,10,10" title="Zone">'),
    map('<area href="/a" coords="0,0,10,10" title="Paris" aria-hidden="true">'),
    `<div hidden>${map('<area href="/a" coords="0,0,10,10" title="Paris">')}</div>`
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page(map('<area href="/a" coords="0,0,10,10" title="Paris">'));
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
  const byTag = runa11yCoreOnHtml(html, { engineOptions: { tags: { include: 'rgaa' } } });
  assert.ok(byTag.checksResults.some((r) => r.ruleId === RULE_ID));
});

function verdicts(body) {
  const html = page(body);
  const rgaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  const rollup = (r, id) => (r.rulesResults.find((x) => x.ruleId === id) || {}).outcome;
  const check = (r, id) => (r.checksResults.find((x) => x.ruleId === id) || {}).outcome;
  assert.equal(rollup(rgaa, WCAG_ROLLUP), rollup(wcag, WCAG_ROLLUP), body);
  assert.equal(check(rgaa, WCAG_RULE), check(wcag, WCAG_RULE), body);
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(wcag, WCAG_RULE)
  };
}

test(`${RULE_ID}: RGAA profile, a title-only area: WCAG passes, RGAA 1.1 fails`, () => {
  assert.deepEqual(verdicts(map('<area href="/a" coords="0,0,10,10" title="Paris">')), {
    rule: 'fail',
    rgaa: 'fail',
    wcagRule: 'pass'
  });
});

test(`${RULE_ID}: RGAA profile, the two agree on alt and on an unnamed area`, () => {
  const named = verdicts(map('<area href="/a" coords="0,0,10,10" alt="Paris">'));
  assert.deepEqual([named.wcagRule, named.rule], ['pass', 'pass']);
  assert.notEqual(named.rgaa, 'fail');
  // An unnamed area stays with area-alt-present, which keeps 1.1.2.
  assert.deepEqual(verdicts(map('<area href="/a" coords="0,0,10,10">')), {
    rule: 'notApplicable',
    rgaa: 'fail',
    wcagRule: 'fail'
  });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/area-alt-source-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(
    rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]),
    ['aas_case_01', 'aas_case_02']
  );
});
