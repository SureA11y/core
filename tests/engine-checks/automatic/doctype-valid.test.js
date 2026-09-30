'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'doctype-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };
const BODY = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';

const scan = (html, options = {}) => runa11yCoreOnHtml(html, { ...RUN, ...options });
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: the HTML5 doctype passes, with or without about:legacy-compat`, () => {
  for (const doctype of ['<!doctype html>', '<!DOCTYPE html SYSTEM "about:legacy-compat">']) {
    assertRule(scan(doctype + BODY), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: the W3C recommended doctypes pass`, () => {
  for (const doctype of [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 plus MathML 2.0 plus SVG 1.1//EN" "http://www.w3.org/2002/04/xhtml-math-svg/xhtml-math-svg.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd">',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/html401-rdfa11-1.dtd">'
  ]) {
    assertRule(scan(doctype + BODY), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an unknown doctype fails, naming what was declared`, () => {
  for (const doctype of [
    '<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<!DOCTYPE html SYSTEM "http://example.com/custom.dtd">'
  ]) {
    const rule = assertRule(scan(doctype + BODY), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'invalidDoctype');
    assert.equal(occ.i18n.summaryKey, 'doctypeValid_summary_fail');
    assert.equal(occ.i18n.hintKey, 'doctypeValid_hint_fail');
    assert.match(occ.html, /^<!DOCTYPE /);
  }
});

test(`${RULE_ID}: a page with no doctype is not applicable (doctype-present fails it)`, () => {
  assertRule(scan(BODY), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable on a scoped run or a fragment`, () => {
  const html = '<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">' + BODY;
  assertRule(scan(html, { contextSelector: 'body' }), RULE_ID, 'notApplicable');
  assertRule(scan(html, { engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    scan('<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">' + BODY, { engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'La page déclare un doctype qui n’est ni HTML5 ni recommandé par le W3C.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = '<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">' + BODY;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.1 rollup id run it`, () => {
  const html = '<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">' + BODY;
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.1' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// WCAG has no doctype requirement, so no WCAG rollup changes. Under 8.1,
// a missing doctype fails 8.1.1 through doctype-present, and an invalid one
// fails 8.1.2 through this rule; each finding carries its own test.
test(`${RULE_ID}: RGAA 8.1 reports a missing doctype under 8.1.1 and an invalid one under 8.1.2`, () => {
  const tests = (result, id) => {
    const rule = result.checksResults.find((r) => r.ruleId === id);
    return ((rule.meta && rule.meta.normativeMappings) || [])
      .filter((m) => m.standard === 'RGAA')
      .map((m) => m.requirement);
  };

  const invalid = runa11yCoreOnHtml('<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">' + BODY, RGAA);
  assert.equal(rollup(invalid, 'rgaa-4.1.2-8.1').outcome, 'fail');
  assert.equal(invalid.checksResults.find((r) => r.ruleId === 'doctype-present').outcome, 'pass');
  assert.deepEqual(tests(invalid, RULE_ID), ['8.1.2']);

  const missing = runa11yCoreOnHtml(BODY, RGAA);
  assert.equal(rollup(missing, 'rgaa-4.1.2-8.1').outcome, 'fail');
  assert.equal(missing.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'notApplicable');
  assert.deepEqual(tests(missing, 'doctype-present'), ['8.1.1']);

  const html5 = runa11yCoreOnHtml('<!doctype html>' + BODY, RGAA);
  assert.equal(rollup(html5, 'rgaa-4.1.2-8.1').outcome, 'pass');
  assert.deepEqual(rollup(html5, 'rgaa-4.1.2-8.1').data.details.checksIds.sort(), [
    'doctype-present',
    RULE_ID
  ]);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  // Whole-document rule: the fixture shows the invalid-doctype branch only.
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(scan(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'invalidDoctype');
});
