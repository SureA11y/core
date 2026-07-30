'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-title-patterns';

function withTitle(title) {
    return `<!doctype html><html lang="en"><head><title>${title}</title></head><body>Hi</body></html>`;
}

function getFirstOccurrence(rule) {
    assert.ok(rule);
    assert.ok(Array.isArray(rule.occurrences));
    assert.ok(rule.occurrences.length > 0, 'Expected at least one occurrence');
    return rule.occurrences[0];
}

function assertOccShape(occ) {
    assert.ok(occ && typeof occ === 'object', 'occurrence must be an object');
    assert.strictEqual(occ.selector, 'head > title', 'selector should be "head > title"');

    assert.ok(occ.i18n && typeof occ.i18n === 'object', 'occurrence.i18n must exist');
    assert.ok(typeof occ.i18n.summaryKey === 'string' && occ.i18n.summaryKey.trim(), 'occurrence.i18n.summaryKey must be non-empty');
    assert.ok(typeof occ.i18n.hintKey === 'string' && occ.i18n.hintKey.trim(), 'occurrence.i18n.hintKey must be non-empty');

    assert.ok(occ.data && typeof occ.data === 'object', 'occurrence.data must exist');
    assert.ok(occ.data.details && typeof occ.data.details === 'object', 'occurrence.data.details must exist');
    assert.ok(typeof occ.data.details.reasonCode === 'string' && occ.data.details.reasonCode.trim(), 'details.reasonCode must be non-empty');
}

// Deliberately varied words/lengths (no shared long prefix/suffix) so the
// "distinct" branch below doesn't accidentally trip the template-signal heuristic.
const DISTINCT_WORDS = ['Contact', 'Pricing', 'About', 'Careers', 'Blog', 'FAQ', 'Support', 'Docs', 'Team', 'Legal'];

function pagesOf(n, { duplicateTitle = null, templatePrefix = null } = {}) {
    const pages = [];
    for (let i = 0; i < n; i++) {
        let title;
        if (duplicateTitle) {
            title = duplicateTitle;
        } else if (templatePrefix) {
            title = `${templatePrefix} - Section ${i}`;
        } else {
            title = `${DISTINCT_WORDS[i % DISTINCT_WORDS.length]} info xyz ${i}`;
        }
        pages.push({ url: `https://example.test/page${i}`, title });
    }
    return pages;
}

// =========================
// Single-page heuristics (no crawl.pageTitles probe)
// =========================

test('notApplicable (never fail/pass) when there is no title at all', () => {
    const html = '<!doctype html><html lang="en"><head></head><body>Hi</body></html>';

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
    assert.ok(rule.outcome !== 'pass' && rule.outcome !== 'fail', 'manual rule must never pass/fail');
});

test('notApplicable when title is empty (defers to the hard-fail automatic rule)', () => {
    const html = withTitle('');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('cantTell for a generic title from the GENERIC_TITLES set ("Home")', () => {
    const html = withTitle('Home');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);
    assert.strictEqual(occ.data.details.reasonCode, 'genericTitle');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePatterns_summary_cantTell_generic');
});

test('cantTell for a generic title from the GENERIC_TITLES set ("Untitled")', () => {
    const html = withTitle('Untitled');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assert.strictEqual(occ.data.details.reasonCode, 'genericTitle');
});

test('cantTell for a very short title (<8 chars) that is not in the generic set', () => {
    const html = withTitle('Acme');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);
    assert.strictEqual(occ.data.details.reasonCode, 'veryShortTitle');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePatterns_summary_cantTell_veryShort');
});

test('cantTell for a template-like title ("Acme | Home")', () => {
    const html = withTitle('Acme | Home');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);
    assert.strictEqual(occ.data.details.reasonCode, 'templateLikeTitle');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePatterns_summary_cantTell_templateLike');
});

test('cantTell for a template-like title ("Home - Acme")', () => {
    const html = withTitle('Home - Acme');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assert.strictEqual(occ.data.details.reasonCode, 'templateLikeTitle');
});

test('notApplicable (not pass) for a normal, descriptive title', () => {
    const html = withTitle('Contact Support - Acme Corporation Help Center');

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
    assert.notStrictEqual(rule.outcome, 'pass', 'manual rule must never report pass, even for a good title');
});

// =========================
// Cross-page pattern analysis (crawl.pageTitles probe, >= 10 analyzable pages)
// =========================

test('cantTell with reasonCode duplicateTitlesAcrossPages when >=10 pages share the same title', () => {
    const html = withTitle('Acme Corporation');
    const probes = { 'crawl.pageTitles': { pages: pagesOf(10, { duplicateTitle: 'Acme Corporation' }) } };

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { probes } });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);
    assert.strictEqual(occ.data.details.reasonCode, 'duplicateTitlesAcrossPages');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePatterns_summary_cantTell_duplicateAcrossPages');
    assert.strictEqual(occ.data.details.metrics.pagesAnalyzed, 10);
    assert.strictEqual(occ.data.details.metrics.duplicateGroups, 1);
});

test('cantTell with reasonCode templatedTitlesAcrossPages when titles share a long common prefix/suffix', () => {
    const html = withTitle('Acme Corporation - Section 0');
    const probes = { 'crawl.pageTitles': { pages: pagesOf(10, { templatePrefix: 'Acme Corporation' }) } };

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { probes } });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assertOccShape(occ);
    assert.strictEqual(occ.data.details.reasonCode, 'templatedTitlesAcrossPages');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePatterns_summary_cantTell_templatedAcrossPages');
});

test('notApplicable when >=10 analyzable pages exist but show no duplicate/template signal', () => {
    const html = withTitle('Distinct Fully Unique Title');
    const probes = { 'crawl.pageTitles': { pages: pagesOf(10) } };

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { probes } });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('falls back to single-page heuristics when fewer than 10 analyzable pages are provided', () => {
    // Only 5 pages in the probe: below MIN_PAGES, so cross-page analysis is skipped
    // and the rule falls back to single-page title heuristics for the current document.
    const html = withTitle('Home');
    const probes = { 'crawl.pageTitles': { pages: pagesOf(5, { duplicateTitle: 'Acme Corporation' }) } };

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { probes } });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

    const occ = getFirstOccurrence(rule);
    assert.strictEqual(occ.data.details.reasonCode, 'genericTitle');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-title-patterns-all-scenarios.html)`, () => {
    const fixturePath = path.join(__dirname, '../..', 'fixtures', 'page-title-patterns-all-scenarios.html');
    const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
    const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = getFirstOccurrence(rule);
    assert.strictEqual(occ.data.details.reasonCode, 'genericTitle');
});

test(`page-title-patterns: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html lang="en"><head><title>Untitled</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['page-title-patterns'], contextSelector: 'body' });
  assertRule(result, 'page-title-patterns', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`page-title-patterns: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html lang="en"><head><title>Untitled</title></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['page-title-patterns'], engineOptions: { fragment: true } });
  assertRule(result, 'page-title-patterns', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
