'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-hidden-body';

test(`${RULE_ID}: pass when body has no aria-hidden attribute`, () => {
  const html = `<!doctype html><html><body><p>content</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when body has aria-hidden="false"`, () => {
  const html = `<!doctype html><html><body aria-hidden="false"><p>content</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when body has aria-hidden="true"`, () => {
  const html = `<!doctype html><html><body aria-hidden="true"><p>content</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_HIDDEN_BODY');
});

test(`${RULE_ID}: declares both 1.3.1 and 4.1.2`, () => {
  const html = `<!doctype html><html><body aria-hidden="true"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.deepStrictEqual(
    rule.meta.normativeMappings.map((m) => m.requirement).sort(),
    ['1.3.1', '4.1.2']
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body aria-hidden="true"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'The document <body> must not be aria-hidden');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-hidden-body-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-hidden-body-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_HIDDEN_BODY');
});

test(`aria-hidden-body: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body aria-hidden="true"><p>content</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-hidden-body'], contextSelector: 'body' });
  assertRule(result, 'aria-hidden-body', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`aria-hidden-body: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body aria-hidden="true"><p>content</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-hidden-body'], engineOptions: { fragment: true } });
  assertRule(result, 'aria-hidden-body', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
