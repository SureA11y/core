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

test(`${RULE_ID}: pass when the keys are present and allow zoom`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes"></head><body></body></html>`;
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

// CSS Device Adaptation translates an unparseable value to 0, so these stop
// zoom just as user-scalable=no does (ACT b4f0c3).
test(`${RULE_ID}: fail on values that translate to zero`, () => {
  for (const content of [
    'user-scalable=0.5',
    'user-scalable=invalid',
    'maximum-scale=invalid',
    'maximum-scale=yes'
  ]) {
    const html = `<!doctype html><html><head><meta name="viewport" content="${content}"></head><body><p>x</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: a negative maximum-scale is dropped by the browser and passes`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="maximum-scale=-1"></head><body><p>x</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when content sets neither key`, () => {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><p>x</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// The pass/fail boundaries: user-scalable fails inside -1..1 exclusive,
// maximum-scale fails from 0 up to but not including 2.
test(`${RULE_ID}: boundary values`, () => {
  const cases = [
    ['user-scalable=1', 'pass'],
    ['user-scalable=-1', 'pass'],
    ['user-scalable=0', 'fail'],
    ['user-scalable=0.999', 'fail'],
    ['user-scalable=-0.999', 'fail'],
    ['maximum-scale=2', 'pass'],
    ['maximum-scale=1.999', 'fail'],
    ['maximum-scale=0', 'fail'],
    ['user-scalable=device-width', 'pass'],
    ['maximum-scale=device-height', 'pass']
  ];
  for (const [content, expected] of cases) {
    const html = `<!doctype html><html><head><meta name="viewport" content="${content}"></head><body><p>x</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(
      result,
      RULE_ID,
      expected,
      expected === 'pass' ? { maxOccurrences: 0 } : { minOccurrences: 1 }
    );
  }
});
