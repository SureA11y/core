'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'canvas-decorative-aria-hidden';
const WCAG_RULE = 'canvas-text-alternative-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.2';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);

test(`${RULE_ID}: aria-hidden="true" with no alternative passes`, () => {
  for (const body of [
    '<canvas aria-hidden="true"></canvas>',
    '<canvas role="presentation" aria-hidden="true"></canvas>',
    '<canvas aria-hidden="true" aria-label=" "></canvas>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: aria-hidden="true" with an alternative fails and names it`, () => {
  const cases = [
    ['<canvas aria-hidden="true" aria-label="x"></canvas>', ['aria-label'], 'aria-label'],
    ['<canvas aria-hidden="true" title="x"></canvas>', ['title'], 'title'],
    ['<canvas aria-hidden="true">Motif</canvas>', ['fallbackContent'], '<canvas>…</canvas>'],
    [
      '<canvas aria-hidden="true" aria-labelledby="l"><img src="a.png" alt="Motif"></canvas>',
      ['aria-labelledby', 'childAlternative'],
      'aria-labelledby, <canvas>…</canvas>'
    ]
  ];
  for (const [body, alternatives, shown] of cases) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'hiddenCanvasHasAlternative', body);
    assert.deepEqual(occ.data.details.alternatives, alternatives, body);
    assert.deepEqual(occ.i18n.params, { alternatives: shown }, body);
  }
});

test(`${RULE_ID}: role="presentation" or "none" without aria-hidden fails`, () => {
  for (const [body, role] of [
    ['<canvas role="presentation"></canvas>', 'presentation'],
    ['<canvas role="none" aria-label="Fond"></canvas>', 'none']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'presentationWithoutAriaHidden');
    assert.deepEqual(rule.occurrences[0].i18n.params, { role });
  }
});

test(`${RULE_ID}: role="presentation" with fallback content is asked about`, () => {
  const rule = assertRule(
    run('<canvas role="none">Ventes 2024 : 10 000</canvas>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'presentationWithContent');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'canvasDecorativeAriaHidden_summary_cantTell_content'
  );
});

test(`${RULE_ID}: canvases not marked decorative, or with a caption, are not applicable`, () => {
  for (const body of [
    '<canvas></canvas>',
    '<canvas role="img" aria-label="Ventes"></canvas>',
    '<div aria-hidden="true"><canvas></canvas></div>',
    '<figure><canvas role="presentation"></canvas><figcaption>Photo : A. Martin</figcaption></figure>',
    '<div hidden><canvas role="presentation"></canvas></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page('<canvas role="presentation"></canvas>');
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
    wcagRule: check(wcag, WCAG_RULE),
    wcag: rollup(wcag, WCAG_ROLLUP)
  };
}

test(`${RULE_ID}: RGAA profile, role="presentation" alone: WCAG passes, RGAA 1.2 fails`, () => {
  const v = verdicts('<canvas role="presentation"></canvas>');
  assert.deepEqual([v.wcagRule, v.rule, v.rgaa], ['pass', 'fail', 'fail']);
  assert.notEqual(v.wcag, 'fail');
});

test(`${RULE_ID}: RGAA profile, the two standards agree on aria-hidden="true" with nothing else`, () => {
  const v = verdicts('<canvas aria-hidden="true"></canvas>');
  assert.equal(v.wcagRule, 'notApplicable');
  assert.equal(v.rule, 'pass');
  assert.equal(v.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/canvas-decorative-aria-hidden-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      (o.html.match(/id="([^"]+)"/) || [])[1],
      o.data.details.reasonCode
    ]),
    [
      ['cdah_case_01', 'presentationWithoutAriaHidden'],
      ['cdah_case_02', 'hiddenCanvasHasAlternative'],
      ['cdah_case_03', 'hiddenCanvasHasAlternative'],
      ['cdah_case_04', 'presentationWithContent']
    ]
  );
});
