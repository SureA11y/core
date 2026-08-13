'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-refresh-timing-absent';

test(`${RULE_ID}: notApplicable when there is no meta refresh tag`, () => {
  const html = `<!doctype html><html><head></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when refresh delay is 0 (immediate redirect)`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when refresh delay is positive`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="5;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.delay, 5);
});

test(`${RULE_ID}: pass when refresh delay exceeds 20 hours (WCAG 2.2.1 Exception 3)`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="72001;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when refresh delay is exactly 20 hours (boundary, not exempt)`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="72000;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.delay, 72000);
});

test(`${RULE_ID}: notApplicable for a meta refresh nested inside noscript`, () => {
  // See the same regression in meta-refresh-no-exceptions.test.js.
  const html = `<!doctype html><html><head><noscript><meta http-equiv="refresh" content="5;url=https://example.com"></noscript></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when content is unparseable`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="10"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must not use a timed meta refresh');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/meta-refresh-timing-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'meta-refresh-timing-absent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.delay, 5);
});

test(`meta-refresh-timing-absent: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="5;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-refresh-timing-absent'],
    contextSelector: 'body'
  });
  assertRule(result, 'meta-refresh-timing-absent', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`meta-refresh-timing-absent: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><meta http-equiv="refresh" content="5;url=https://example.com"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-refresh-timing-absent'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'meta-refresh-timing-absent', 'notApplicable', {
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

test(`${RULE_ID}: valid directives are still evaluated`, () => {
  const cases = [
    ['0', 'pass'],
    ['0; url=/x', 'pass'],
    ['5', 'fail'],
    ['2 url=/x', 'fail']
  ];
  for (const [content, expected] of cases) {
    const html = `<!doctype html><html><head><meta http-equiv="refresh" content="${content}"></head><body>x</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(
      result,
      RULE_ID,
      expected,
      expected === 'pass' ? { maxOccurrences: 0 } : { minOccurrences: 1 }
    );
  }
});
