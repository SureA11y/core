'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-meta-refresh-timing-absent';

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
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'meta-refresh-timing-absent-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.delay, 5);
});