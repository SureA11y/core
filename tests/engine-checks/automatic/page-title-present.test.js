'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-title-present';

function getFirstOccurrence(rule) {
  assert.ok(rule);
  assert.ok(Array.isArray(rule.occurrences));
  assert.ok(rule.occurrences.length > 0, 'Expected at least one occurrence');
  return rule.occurrences[0];
}

function assertOccShape(occ) {
  assert.ok(occ && typeof occ === 'object', 'occurrence must be an object');

  assert.strictEqual(occ.selector, 'head > title', 'selector should be "head > title"');
  assert.ok(typeof occ.html === 'string', 'html snippet must be a string');

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

test('fail when <title> is missing entirely', () => {
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_missing');
  assert.strictEqual(occ.data.details.reasonCode, 'missingTitleElement');
  assert.strictEqual(occ.html, '<title>(missing)</title>');
});

test('fail when <title></title> is empty', () => {
  const html = '<!doctype html><html lang="en"><head><title></title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'emptyTitleText');
});

test('fail when <title> is whitespace-only', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>   </title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'emptyTitleText');
});

test('pass when <title> is non-empty and inside <head>', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>Acme Contact Support</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-title-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'page-title-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'emptyTitleText');
});

test('pass when <title> is non-empty but ends up outside <head> (in <body>)', () => {
  // Regression test: a <title> encountered after <head> has closed is not
  // re-parented into <head> per HTML parsing rules, but document.title still
  // resolves it. This previously produced a false "missing title" fail.
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><title>Acme Contact Support</title>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`page-title-present: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['page-title-present'],
    contextSelector: 'body'
  });
  assertRule(result, 'page-title-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`page-title-present: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['page-title-present'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'page-title-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
