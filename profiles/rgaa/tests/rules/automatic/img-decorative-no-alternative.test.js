'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'img-decorative-no-alternative';
const WCAG_RULE = 'presentation-role-conflict';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.2';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);

test(`${RULE_ID}: a decorative image with none of the three attributes passes`, () => {
  for (const body of [
    '<img src="a.png" alt="">',
    '<img src="a.png" aria-hidden="true">',
    '<img src="a.png" alt="Filet" aria-hidden="true">',
    '<img src="a.png" role="presentation">',
    '<img src="a.png" alt="" title="" aria-label=" ">',
    '<img src="a.png" alt="" aria-describedby="d"><p id="d">Filet</p>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: aria-hidden="true" with aria-label, aria-labelledby or title fails`, () => {
  for (const [body, attributes] of [
    ['<img src="a.png" alt="" aria-hidden="true" aria-label="Décor">', ['aria-label']],
    ['<img src="a.png" aria-hidden="true" title="Filet">', ['title']],
    [
      '<img src="a.png" aria-hidden="true" aria-labelledby="l" title="Filet">',
      ['aria-labelledby', 'title']
    ]
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'hiddenImgHasAlternative', body);
    assert.deepEqual(occ.data.details.attributes, attributes, body);
    assert.deepEqual(occ.i18n.params, { attributes: attributes.join(', ') });
  }
});

test(`${RULE_ID}: alt="" or role="presentation" with one of them is asked about (the image may be informative)`, () => {
  for (const [body, marker] of [
    ['<img src="a.png" alt="" title="Logo">', 'alt=""'],
    ['<img src="a.png" role="presentation" aria-label="Carte">', 'role="presentation"'],
    ['<img src="a.png" role="none" aria-labelledby="l">', 'role="none"']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'decorativeImgHasAlternative', body);
    assert.equal(occ.i18n.params.marker, marker);
  }
});

test(`${RULE_ID}: informative images, captioned images and other elements are not applicable`, () => {
  for (const body of [
    '<img src="a.png" alt="Logo" title="Logo">',
    '<img src="a.png">',
    '<figure><img src="a.png" alt="" title="Photo"><figcaption>Photo : A. Martin</figcaption></figure>',
    '<div role="presentation" tabindex="0">x</div>',
    '<div hidden><img src="a.png" alt="" aria-hidden="true" title="x"></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page('<img src="a.png" alt="" aria-hidden="true" aria-label="Décor">');
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

// presentation-role-conflict has no WCAG criterion: its verdict is read from a
// default run. After M30 it maps to no RGAA test, so the RGAA profile no
// longer runs it and 1.2 takes this rule's verdict alone.
function verdicts(body) {
  const html = page(body);
  const rgaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const plain = runa11yCoreOnHtml(html);
  const rollup = (r, id) => (r.rulesResults.find((x) => x.ruleId === id) || {}).outcome;
  const check = (r, id) => (r.checksResults.find((x) => x.ruleId === id) || {}).outcome;
  const conflict = rgaa.checksResults.find((x) => x.ruleId === WCAG_RULE);
  assert.ok(!conflict || !conflict.rollupIds.includes(RGAA_ROLLUP), 'unlinked from 1.2.1');
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(plain, WCAG_RULE)
  };
}

test(`${RULE_ID}: RGAA profile, aria-hidden with aria-label: the WCAG-side rule is silent, RGAA 1.2 fails`, () => {
  assert.deepEqual(verdicts('<img src="a.png" alt="" aria-hidden="true" aria-label="Décor">'), {
    rule: 'fail',
    rgaa: 'fail',
    wcagRule: 'notApplicable'
  });
});

test(`${RULE_ID}: RGAA profile, a focusable role="presentation" div: the WCAG-side rule asks, RGAA 1.2 is not concerned`, () => {
  const v = verdicts('<div role="presentation" tabindex="0">x</div>');
  assert.equal(v.wcagRule, 'cantTell');
  assert.equal(v.rule, 'notApplicable');
  assert.equal(v.rgaa, 'notApplicable');
});

test(`${RULE_ID}: RGAA profile, the two agree that alt="" alone raises nothing`, () => {
  const v = verdicts('<img src="a.png" alt="">');
  assert.equal(v.wcagRule, 'notApplicable');
  assert.equal(v.rule, 'pass');
  assert.equal(v.rgaa, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/img-decorative-no-alternative-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['idna_case_01', 'fail'],
      ['idna_case_02', 'fail'],
      ['idna_case_03', 'cantTell'],
      ['idna_case_04', 'cantTell']
    ]
  );
});
