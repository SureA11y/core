'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-refresh-no-exceptions';

test(`${RULE_ID}: notApplicable when there is no meta refresh tag`, () => {
  const html = `<!doctype html><html><head></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail even when delay is 0`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'META_REFRESH_PRESENT');
});

test(`${RULE_ID}: fail when delay is positive`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="5"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable for a meta refresh nested inside noscript`, () => {
  // Regression for a false positive: a meta refresh nested inside <noscript>,
  // e.g. <noscript><meta http-equiv="refresh" content="0; URL=/?nojsmode=1"></noscript>
  // — a JS-disabled fallback that never takes effect for any context capable
  // of running accessibility tooling in the first place.
  const html = `<!doctype html><html><head><noscript><meta http-equiv="refresh" content="0; URL=/?nojsmode=1"></noscript></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must not use a meta refresh at all (AAA)');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/meta-refresh-no-exceptions-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'meta-refresh-no-exceptions-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'META_REFRESH_PRESENT');
});

test(`meta-refresh-no-exceptions: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-refresh-no-exceptions'],
    contextSelector: 'body'
  });
  assertRule(result, 'meta-refresh-no-exceptions', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`meta-refresh-no-exceptions: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-refresh-no-exceptions'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'meta-refresh-no-exceptions', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// An invalid refresh directive never refreshes, so there is nothing to report.
test(`${RULE_ID}: notApplicable for content that is not a valid refresh directive`, () => {
  for (const content of ['foo; URL=/x', '+72001; /x', '-00.12 foo', '0:1', '; 72001']) {
    const html = `<!doctype html><html><head><meta http-equiv="refresh" content="${content}"></head><body>x</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});
