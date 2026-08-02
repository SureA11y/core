'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-viewport-zoom-enabled';

test(`${RULE_ID}: notApplicable when there is no viewport meta tag`, () => {
  const html = `<!doctype html><html><head></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when viewport allows zoom`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when user-scalable=no`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.reasons.some((r) => r.includes('user-scalable')));
});

test(`${RULE_ID}: fail when maximum-scale is below 2`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=1.5"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.reasons.some((r) => r.includes('maximum-scale')));
});

test(`${RULE_ID}: pass when maximum-scale is 2 or above`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=5"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="user-scalable=no"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Viewport meta tag must not disable zoom');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/meta-viewport-zoom-enabled-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'meta-viewport-zoom-enabled-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(rule.occurrences[0].data.details.reasons.some((r) => r.includes('user-scalable')));
});

test(`meta-viewport-zoom-enabled: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-viewport-zoom-enabled'],
    contextSelector: 'body'
  });
  assertRule(result, 'meta-viewport-zoom-enabled', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`meta-viewport-zoom-enabled: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['meta-viewport-zoom-enabled'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'meta-viewport-zoom-enabled', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
