'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'html-xml-lang-mismatch';

test(`${RULE_ID}: notApplicable when only lang is present`, () => {
  const html = `<!doctype html><html lang="en"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when lang and xml:lang share a primary subtag`, () => {
  const html = `<!doctype html><html lang="en-US" xml:lang="en-GB"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when lang and xml:lang disagree`, () => {
  const html = `<!doctype html><html lang="en" xml:lang="fr"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HTML_XML_LANG_MISMATCH');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html lang="en" xml:lang="fr"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'lang and xml:lang must not disagree');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/html-xml-lang-mismatch-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'html-xml-lang-mismatch-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HTML_XML_LANG_MISMATCH');
});

test(`html-xml-lang-mismatch: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html lang="en" xml:lang="fr"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['html-xml-lang-mismatch'],
    contextSelector: 'body'
  });
  assertRule(result, 'html-xml-lang-mismatch', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`html-xml-lang-mismatch: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html lang="en" xml:lang="fr"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['html-xml-lang-mismatch'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'html-xml-lang-mismatch', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// ACT 5b7ae0 applies only when lang has a known primary language subtag
// (#158): lang="xx" is html-lang-attr-present's failure, not a second one.
test('html-xml-lang-mismatch: notApplicable when lang names no known language', () => {
  const page = (attrs) =>
    `<!doctype html><html ${attrs}><head><title>t</title></head><body><main>x</main></body></html>`;
  const outcomes = (attrs) =>
    Object.fromEntries(
      runa11yCoreOnHtml(page(attrs), {
        runOnly: ['html-xml-lang-mismatch', 'html-lang-attr-present']
      }).checksResults.map((r) => [r.ruleId, r.outcome])
    );
  assert.deepStrictEqual(outcomes('lang="xx" xml:lang="yy"'), {
    'html-lang-attr-present': 'fail',
    'html-xml-lang-mismatch': 'notApplicable'
  });
  assert.strictEqual(outcomes('lang="en" xml:lang="fr"')['html-xml-lang-mismatch'], 'fail');
  assert.strictEqual(outcomes('lang="en" xml:lang="en-GB"')['html-xml-lang-mismatch'], 'pass');
});
