'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'html-lang-attr-present';

function getFirstOccurrence(rule) {
    assert.ok(rule);
    assert.ok(Array.isArray(rule.occurrences));
    assert.ok(rule.occurrences.length > 0, 'Expected at least one occurrence');
    return rule.occurrences[0];
}

function assertOccShape(occ) {
    assert.ok(occ && typeof occ === 'object', 'occurrence must be an object');

    assert.strictEqual(occ.selector, 'html', 'selector should be "html"');
    assert.ok(typeof occ.html === 'string' && occ.html.length > 0, 'html snippet must be a non-empty string');

    assert.ok(occ.i18n && typeof occ.i18n === 'object', 'occurrence.i18n must exist');
    assert.ok(typeof occ.i18n.summaryKey === 'string' && occ.i18n.summaryKey.trim(), 'occurrence.i18n.summaryKey must be non-empty');
    assert.ok(typeof occ.i18n.hintKey === 'string' && occ.i18n.hintKey.trim(), 'occurrence.i18n.hintKey must be non-empty');
    assert.ok(occ.i18n.params && typeof occ.i18n.params === 'object', 'occurrence.i18n.params must be an object');

    assert.ok(occ.data && typeof occ.data === 'object', 'occurrence.data must exist');
    assert.ok(occ.data.visibilityFilter && typeof occ.data.visibilityFilter === 'object', 'occurrence.data.visibilityFilter must exist');
    assert.ok(occ.data.details && typeof occ.data.details === 'object', 'occurrence.data.details must exist');
    assert.ok(typeof occ.data.details.reasonCode === 'string' && occ.data.details.reasonCode.trim(), 'details.reasonCode must be non-empty');
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
    const html = '<!doctype html><html lang="   "><head><title>x</title></head><body>Hi</body></html>';

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);

    assert.strictEqual(occ.i18n.summaryKey, 'html_lang_attr_missing_empty');
    assert.strictEqual(occ.i18n.hintKey, 'html_lang_attr_hint_missing_empty');
    assert.strictEqual(occ.data.details.reasonCode, 'lang-empty');
});

test('fail when <html> lang is invalid', () => {
    const html = '<!doctype html><html lang="english"><head><title>x</title></head><body>Hi</body></html>';

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
    const html = '<!doctype html><html lang="fr-CH"><head><title>x</title></head><body>Salut</body></html>';

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass when <html> lang is valid language tag with subtags (pt-BR)', () => {
    const html = '<!doctype html><html lang="pt-BR"><head><title>x</title></head><body>Oi</body></html>';

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass (known scope limitation) when lang is syntactically valid but not a real registered subtag (xx-ZZ)', () => {
    // The rule performs a minimal BCP47 *syntax* check only; it does not validate
    // against the IANA Language Subtag Registry. "xx-ZZ" is syntactically well-formed
    // (2-letter primary subtag + 2-letter region subtag) even though neither subtag is
    // a real registered value, so it currently passes. This is a documented, accepted
    // scope limitation (semantic/registry validation is out of scope for SC 3.1.1's
    // "programmatically declared" requirement), not a bug to fix here.
    const html = '<!doctype html><html lang="xx-ZZ"><head><title>x</title></head><body>Hi</body></html>';

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/language-page-present-all-scenarios.html)`, () => {
    const fixturePath = path.join(__dirname, '../..', 'fixtures', 'language-page-present-all-scenarios.html');
    const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
    const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'lang-invalid-bcp47');
});

test(`html-lang-attr-present: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><title>x</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['html-lang-attr-present'], contextSelector: 'body' });
  assertRule(result, 'html-lang-attr-present', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`html-lang-attr-present: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><title>x</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['html-lang-attr-present'], engineOptions: { fragment: true } });
  assertRule(result, 'html-lang-attr-present', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
