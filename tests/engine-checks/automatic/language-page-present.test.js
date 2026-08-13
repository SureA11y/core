'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'html-lang-attr-present';

// Every scenario above runs through runa11yCoreOnHtml/runa11yCoreOnDom
// (toString-embedded), which Node's --experimental-test-coverage can't
// attribute back to this file (see tests/node-runtime-parity.test.js's
// header comment). The fixture the generic harness runs through the real
// entry point only exercises the invalid-lang FAIL branch, so
// lang-missing/lang-empty/pass/non-<html>-root never ran through it.
// Exercise them here via runDomRulesInPage.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function ruleFrom(result) {
  return result.checksResults.find((r) => r.ruleId === RULE_ID);
}

function getFirstOccurrence(rule) {
  assert.ok(rule);
  assert.ok(Array.isArray(rule.occurrences));
  assert.ok(rule.occurrences.length > 0, 'Expected at least one occurrence');
  return rule.occurrences[0];
}

function assertOccShape(occ) {
  assert.ok(occ && typeof occ === 'object', 'occurrence must be an object');

  assert.strictEqual(occ.selector, 'html', 'selector should be "html"');
  assert.ok(
    typeof occ.html === 'string' && occ.html.length > 0,
    'html snippet must be a non-empty string'
  );

  assert.ok(occ.i18n && typeof occ.i18n === 'object', 'occurrence.i18n must exist');
  assert.ok(
    typeof occ.i18n.summaryKey === 'string' && occ.i18n.summaryKey.trim(),
    'occurrence.i18n.summaryKey must be non-empty'
  );
  assert.ok(
    typeof occ.i18n.hintKey === 'string' && occ.i18n.hintKey.trim(),
    'occurrence.i18n.hintKey must be non-empty'
  );
  assert.ok(
    occ.i18n.params && typeof occ.i18n.params === 'object',
    'occurrence.i18n.params must be an object'
  );

  assert.ok(occ.data && typeof occ.data === 'object', 'occurrence.data must exist');
  assert.ok(
    occ.data.visibilityFilter && typeof occ.data.visibilityFilter === 'object',
    'occurrence.data.visibilityFilter must exist'
  );
  assert.ok(
    occ.data.details && typeof occ.data.details === 'object',
    'occurrence.data.details must exist'
  );
  assert.ok(
    typeof occ.data.details.reasonCode === 'string' && occ.data.details.reasonCode.trim(),
    'details.reasonCode must be non-empty'
  );
}

test('notApplicable when document root is not <html> (XML document)', () => {
  const dom = createDom('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
    url: 'https://example.test/',
    contentType: 'application/xml'
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail when <html> has no lang attribute', () => {
  const html = '<!doctype html><html><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'html_lang_attr_missing_absent');
  assert.strictEqual(occ.i18n.hintKey, 'html_lang_attr_hint_missing_absent');
  assert.strictEqual(occ.data.details.reasonCode, 'lang-missing');
});

test('fail when <html> lang is empty string', () => {
  const html = '<!doctype html><html lang=""><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'html_lang_attr_missing_empty');
  assert.strictEqual(occ.i18n.hintKey, 'html_lang_attr_hint_missing_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'lang-empty');
});

test('fail when <html> lang is whitespace-only', () => {
  const html =
    '<!doctype html><html lang="   "><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'html_lang_attr_missing_empty');
  assert.strictEqual(occ.i18n.hintKey, 'html_lang_attr_hint_missing_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'lang-empty');
});

test('fail when <html> lang is invalid', () => {
  const html =
    '<!doctype html><html lang="english"><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'html_lang_attr_invalid');
  assert.strictEqual(occ.i18n.hintKey, 'html_lang_attr_hint_invalid');
  assert.strictEqual(occ.data.details.reasonCode, 'lang-invalid-bcp47');

  // Param must be present for translation interpolation
  assert.strictEqual(occ.i18n.params.lang, 'english');
});

test('pass when <html> lang is valid primary language subtag (en)', () => {
  const html = '<!doctype html><html lang="en"><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass when <html> lang is valid language tag with subtags (fr-CH)', () => {
  const html =
    '<!doctype html><html lang="fr-CH"><head><title>x</title></head><body>Salut</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass when <html> lang is valid language tag with subtags (pt-BR)', () => {
  const html =
    '<!doctype html><html lang="pt-BR"><head><title>x</title></head><body>Oi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail when the primary subtag is not in the IANA registry (xx-ZZ)', () => {
  // A well-formed but unregistered tag declares no determinable language, so
  // the primary subtag is checked against the registry, not just the shape.
  const html =
    '<!doctype html><html lang="xx-ZZ"><head><title>x</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test('fail on a three-letter tag whose two-letter form is the registered one (eng)', () => {
  const html =
    '<!doctype html><html lang="eng"><head><title>x</title></head><body>Hi</body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test('pass on registered tags, including three-letter ones with no two-letter form', () => {
  for (const lang of ['en', 'FR', 'en-US-GB', 'haw', 'yue']) {
    const html = `<!doctype html><html lang="${lang}"><head><title>x</title></head><body>Hi</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/language-page-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'language-page-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'lang-invalid-bcp47');
});

test(`html-lang-attr-present: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><title>x</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['html-lang-attr-present'],
    contextSelector: 'body'
  });
  assertRule(result, 'html-lang-attr-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`html-lang-attr-present: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><title>x</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['html-lang-attr-present'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'html-lang-attr-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID} (node runtime): fail when <html> has no lang attribute`, () => {
  const html = '<!doctype html><html><head><title>x</title></head><body>Hi</body></html>';
  const rule = ruleFrom(runNode(html));
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences.length, 1);
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'lang-missing');
});

test(`${RULE_ID} (node runtime): fail when <html> lang is empty string`, () => {
  const html = '<!doctype html><html lang=""><head><title>x</title></head><body>Hi</body></html>';
  const rule = ruleFrom(runNode(html));
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'lang-empty');
});

test(`${RULE_ID} (node runtime): fail when <html> lang is invalid BCP47`, () => {
  const html =
    '<!doctype html><html lang="english"><head><title>x</title></head><body>Hi</body></html>';
  const rule = ruleFrom(runNode(html));
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'lang-invalid-bcp47');
  assert.strictEqual(rule.occurrences[0].i18n.params.lang, 'english');
});

test(`${RULE_ID} (node runtime): notApplicable when document root is not <html> (XML document)`, () => {
  const dom = createDom('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
    url: 'https://example.test/',
    contentType: 'application/xml'
  });
  const result = runDomRulesInPage(
    'https://example.test/',
    null,
    {},
    { includeRuleIds: [RULE_ID] }
  );
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): pass when <html> lang is a valid tag (en, fr-CH)`, () => {
  for (const lang of ['en', 'fr-CH']) {
    const html = `<!doctype html><html lang="${lang}"><head><title>x</title></head><body>Hi</body></html>`;
    const rule = ruleFrom(runNode(html));
    assert.ok(rule);
    assert.strictEqual(rule.outcome, 'pass', `expected pass for lang="${lang}"`);
    assert.strictEqual(rule.occurrences.length, 0);
  }
});
