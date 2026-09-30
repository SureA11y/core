'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'canvas-role-img';
const WCAG_RULE = 'canvas-text-alternative-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.1';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);

test(`${RULE_ID}: role="img" with an ARIA name, or fallback content without role="img", passes`, () => {
  for (const body of [
    '<canvas role="img" aria-label="Ventes"></canvas>',
    '<p id="l">Ventes</p><canvas role="img" aria-labelledby="l"></canvas>',
    '<canvas>Ventes 2024 : 10 000</canvas>',
    '<canvas aria-label="Ventes">Ventes 2024 : 10 000</canvas>',
    '<canvas><img src="c.png" alt="Ventes 2024"></canvas>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: role="img" without aria-labelledby or aria-label fails, whatever else it has`, () => {
  for (const body of [
    '<canvas role="img">Ventes</canvas>',
    '<canvas role="img" title="Ventes"></canvas>',
    '<canvas role="img"></canvas><a href="/d">Données</a>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'roleImgWithoutAriaName', body);
    assert.equal(rule.occurrences[0].i18n.hintKey, 'canvasRoleImg_hint_fail_roleImg');
  }
});

test(`${RULE_ID}: a name without role="img" and without fallback content fails`, () => {
  for (const [body, source] of [
    ['<canvas aria-label="Ventes"></canvas>', 'aria-label'],
    ['<canvas title="Ventes"></canvas>', 'title'],
    ['<p id="l">Ventes</p><canvas aria-labelledby="l"></canvas>', 'aria-labelledby']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'nameWithoutRoleImg', body);
    assert.deepEqual(rule.occurrences[0].i18n.params, { source });
  }
});

test(`${RULE_ID}: no alternative at all fails with reasonCode noAlternative`, () => {
  const rule = assertRule(run('<canvas width="40" height="20"></canvas>'), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'noAlternative');
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'canvasRoleImg_summary_fail');
});

test(`${RULE_ID}: without role="img" or fallback, an adjacent link or button is asked about`, () => {
  for (const body of [
    '<canvas></canvas><a href="/data">Données</a>',
    '<canvas aria-label="Ventes"></canvas> <button type="button">Tableau</button>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'adjacentLinkOrButton', body);
  }
});

test(`${RULE_ID}: decorative and hidden canvases are not applicable`, () => {
  for (const body of [
    '<canvas aria-hidden="true"></canvas>',
    '<div aria-hidden="true"><canvas></canvas></div>',
    '<canvas role="presentation"></canvas>',
    '<canvas role="none"></canvas>',
    '<div hidden><canvas></canvas></div>',
    '<p>No canvas</p>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page('<canvas aria-label="Ventes"></canvas>');
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
  const wcagRule = rgaa.checksResults.find((x) => x.ruleId === WCAG_RULE);
  assert.ok(!wcagRule.rollupIds.includes(RGAA_ROLLUP), 'unlinked from 1.1.8');
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(wcag, WCAG_RULE),
    wcag: rollup(wcag, WCAG_ROLLUP)
  };
}

test(`${RULE_ID}: RGAA profile, aria-label or title without role="img": WCAG passes, RGAA 1.1 fails`, () => {
  for (const body of [
    '<canvas aria-label="Ventes"></canvas>',
    '<canvas title="Ventes"></canvas>'
  ]) {
    const v = verdicts(body);
    assert.deepEqual([v.wcagRule, v.rule, v.rgaa], ['pass', 'fail', 'fail'], body);
  }
});

test(`${RULE_ID}: RGAA profile, an adjacent link: WCAG fails, RGAA 1.1 asks`, () => {
  const v = verdicts('<canvas></canvas><a href="/data">Données</a>');
  assert.deepEqual([v.wcagRule, v.wcag, v.rule, v.rgaa], ['fail', 'fail', 'cantTell', 'cantTell']);
});

test(`${RULE_ID}: RGAA profile, the two standards agree on role="img" with fallback only and on fallback content`, () => {
  const both = verdicts('<canvas role="img">Ventes</canvas>');
  assert.deepEqual([both.wcagRule, both.rule, both.rgaa], ['fail', 'fail', 'fail']);
  const fallback = verdicts('<canvas>Ventes 2024 : 10 000</canvas>');
  assert.deepEqual([fallback.wcagRule, fallback.rule], ['pass', 'pass']);
  assert.notEqual(fallback.rgaa, 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/canvas-role-img-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      (o.html.match(/id="([^"]+)"/) || [])[1],
      o.data.details.reasonCode
    ]),
    [
      ['cri_case_01', 'roleImgWithoutAriaName'],
      ['cri_case_02', 'nameWithoutRoleImg'],
      ['cri_case_03', 'nameWithoutRoleImg'],
      ['cri_case_04', 'noAlternative'],
      ['cri_case_05', 'adjacentLinkOrButton']
    ]
  );
});
