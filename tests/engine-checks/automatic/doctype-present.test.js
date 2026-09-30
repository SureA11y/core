'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'doctype-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const BODY = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';

function scan(html, options = {}) {
  return runa11yCoreOnHtml(html, { ...RUN, ...options });
}

test(`${RULE_ID}: the HTML5 doctype passes`, () => {
  assertRule(scan('<!doctype html>' + BODY), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: the legacy-compat HTML5 doctype passes`, () => {
  const html = '<!DOCTYPE html SYSTEM "about:legacy-compat">' + BODY;
  assertRule(scan(html), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: W3C recommended legacy doctypes pass`, () => {
  for (const doctype of [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
  ]) {
    assertRule(scan(doctype + BODY), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: the W3C recommended mixed-namespace and RDFa doctypes pass`, () => {
  for (const doctype of [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 plus MathML 2.0 plus SVG 1.1//EN" "http://www.w3.org/2002/04/xhtml-math-svg/xhtml-math-svg.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 plus MathML 2.0//EN" "http://www.w3.org/Math/DTD/mathml2/xhtml-math11-f.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd">',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/html401-rdfa11-1.dtd">'
  ]) {
    assertRule(scan(doctype + BODY), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: no doctype fails as missing`, () => {
  const rule = assertRule(scan(BODY), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'missingDoctype');
  assert.equal(occ.i18n.summaryKey, 'doctypePresent_summary_fail_missing');
  assert.equal(occ.html, '<!DOCTYPE>(missing)');
});

test(`${RULE_ID}: a doctype after <html> is dropped by the parser and fails as missing`, () => {
  const html = '<html lang="en"><!doctype html><head><title>t</title></head><body></body></html>';
  const rule = assertRule(scan(html), RULE_ID, 'fail', { minOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'missingDoctype');
});

test(`${RULE_ID}: an unknown doctype fails as invalid, naming what was declared`, () => {
  for (const doctype of [
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<!DOCTYPE html PUBLIC "-//Example//DTD Custom//EN">'
  ]) {
    const rule = assertRule(scan(doctype + BODY), RULE_ID, 'fail', { minOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'invalidDoctype');
    assert.equal(occ.i18n.summaryKey, 'doctypePresent_summary_fail_invalid');
    assert.match(occ.html, /^<!DOCTYPE /);
  }
});

test(`${RULE_ID}: notApplicable on a scoped run or a fragment`, () => {
  assertRule(scan(BODY, { contextSelector: 'body' }), RULE_ID, 'notApplicable');
  assertRule(scan(BODY, { engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(BODY);
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/doctype-present-all-scenarios.html)`, () => {
  // Whole-document rule: the fixture shows the missing-doctype branch only.
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'doctype-present-all-scenarios.html'
  );
  const result = scan(fs.readFileSync(fixturePath, 'utf8'));
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'missingDoctype');
});
