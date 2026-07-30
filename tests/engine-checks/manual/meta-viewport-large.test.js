'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-viewport-large';

test(`${RULE_ID}: notApplicable when there is no viewport meta tag`, () => {
  const html = `<!doctype html><html><head></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when maximum-scale is 5 or above`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=5"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when maximum-scale is below 5`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=3"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.reasons.some((r) => r.includes('maximum-scale')));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="user-scalable=no"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Viewport meta tag should allow zooming up to 500%');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/meta-viewport-large-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'meta-viewport-large-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'VIEWPORT_ZOOM_BELOW_500');
});

test(`meta-viewport-large: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=3"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['meta-viewport-large'], contextSelector: 'body' });
  assertRule(result, 'meta-viewport-large', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`meta-viewport-large: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=3"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['meta-viewport-large'], engineOptions: { fragment: true } });
  assertRule(result, 'meta-viewport-large', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
