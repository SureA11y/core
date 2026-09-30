'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'object-image-role-img';
const WCAG_RULE = 'object-text-alternative-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.1';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);
const IMG = 'type="image/png" data="c.png"';

test(`${RULE_ID}: role="img" with a text alternative passes`, () => {
  for (const body of [
    `<object ${IMG} role="img" aria-label="Ventes"></object>`,
    `<object ${IMG} role="img" title="Ventes"></object>`,
    `<p id="l">Ventes</p><object ${IMG} role="img" aria-labelledby="l"></object>`,
    '<object type=" IMAGE/SVG+XML " data="c.svg" role="img" aria-label="Ventes"></object>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: no alternative, no fallback and no adjacent link fails`, () => {
  for (const body of [
    `<object ${IMG}></object>`,
    `<object ${IMG} role="img"></object>`,
    `<object ${IMG}><param name="x" value="y"></object>`,
    `<object ${IMG}></object><p>Texte</p><a href="/d">Description</a>`
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'noAlternative', body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'objectImageRoleImg_summary_fail');
  }
});

test(`${RULE_ID}: an alternative without role="img" is asked about (D2)`, () => {
  for (const [body, source] of [
    [`<object ${IMG} aria-label="Ventes"></object>`, 'aria-label'],
    [`<object ${IMG} title="Ventes"></object>`, 'title']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'alternativeWithoutRoleImg');
    assert.deepEqual(rule.occurrences[0].i18n.params, { source });
  }
});

test(`${RULE_ID}: an adjacent link or button is asked about`, () => {
  for (const next of [
    '<a href="/d">Description</a>',
    ' <!-- c --> <button type="button">Voir les données</button>',
    '<p><a href="/d">Description</a> du graphique</p>',
    '<span role="link" tabindex="0">Description</span>'
  ]) {
    const rule = assertRule(run(`<object ${IMG}></object>${next}`), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'adjacentLinkOrButton', next);
  }
});

test(`${RULE_ID}: fallback content only is asked about`, () => {
  for (const body of [
    `<object ${IMG}>Ventes 2024 : 10 000</object>`,
    `<object ${IMG}><img src="c.png" alt="Ventes"></object>`
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'fallbackOnly', body);
  }
});

test(`${RULE_ID}: non-image objects, decorative and hidden objects are not applicable`, () => {
  for (const body of [
    '<object type="application/pdf" data="d.pdf"></object>',
    '<object data="c.png"></object>',
    `<object ${IMG} aria-hidden="true"></object>`,
    `<div aria-hidden="true"><object ${IMG}></object></div>`,
    `<object ${IMG} role="presentation"></object>`,
    `<div hidden><object ${IMG}></object></div>`
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page(`<object ${IMG}></object>`);
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
  assert.ok(!wcagRule.rollupIds.includes(RGAA_ROLLUP), 'unlinked from 1.1.6');
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(wcag, WCAG_RULE),
    wcag: rollup(wcag, WCAG_ROLLUP)
  };
}

test(`${RULE_ID}: RGAA profile, a PDF object with no alternative: WCAG fails, RGAA 1.1 does not`, () => {
  const v = verdicts('<object type="application/pdf" data="d.pdf"></object>');
  assert.equal(v.wcagRule, 'fail');
  assert.equal(v.wcag, 'fail');
  assert.equal(v.rule, 'notApplicable');
  assert.notEqual(v.rgaa, 'fail');
});

test(`${RULE_ID}: RGAA profile, an adjacent link: WCAG fails, RGAA 1.1 asks`, () => {
  const v = verdicts(`<object ${IMG}></object><a href="/d">Description</a>`);
  assert.equal(v.wcagRule, 'fail');
  assert.equal(v.rule, 'cantTell');
  assert.equal(v.rgaa, 'cantTell');
});

test(`${RULE_ID}: RGAA profile, aria-label without role="img": WCAG passes, RGAA 1.1 asks`, () => {
  const v = verdicts(`<object ${IMG} aria-label="Ventes"></object>`);
  assert.equal(v.wcagRule, 'pass');
  assert.equal(v.rule, 'cantTell');
  assert.equal(v.rgaa, 'cantTell');
});

test(`${RULE_ID}: RGAA profile, the two standards agree on no alternative and on role="img" with a name`, () => {
  const none = verdicts(`<object ${IMG}></object>`);
  assert.deepEqual([none.wcagRule, none.rule, none.rgaa], ['fail', 'fail', 'fail']);
  const named = verdicts(`<object ${IMG} role="img" aria-label="Ventes"></object>`);
  assert.deepEqual([named.wcagRule, named.rule, named.rgaa], ['pass', 'pass', 'pass']);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/object-image-role-img-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      (o.html.match(/id="([^"]+)"/) || [])[1],
      o.data.details.reasonCode
    ]),
    [
      ['oiri_case_01', 'noAlternative'],
      ['oiri_case_02', 'noAlternative'],
      ['oiri_case_03', 'alternativeWithoutRoleImg'],
      ['oiri_case_04', 'adjacentLinkOrButton'],
      ['oiri_case_05', 'fallbackOnly']
    ]
  );
});
