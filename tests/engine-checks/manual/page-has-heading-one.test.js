'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'page-has-heading-one';

// The rest of this file drives every scenario through runa11yCoreOnHtml (the
// toString-embedded in-page runner) -- correct behavior, but Node's
// --experimental-test-coverage can't attribute that execution back to this
// file (see tests/node-runtime-parity.test.js's header comment). That
// generic harness runs this rule's own "-all-scenarios.html" fixture through
// the real require()-based entry point once, but that fixture is a single
// CANTTELL case with no <h1>/[role] elements at all, so it never exercises
// isLevelOneHeading/getExplicitRoleToken/isExposedToAt. Re-running a few of
// the scenarios above through runDomRulesInPage directly closes that gap.
function runNode(html, { contextSelector = null, engineOptions = {} } = {}) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', contextSelector, engineOptions, { includeRuleIds: [RULE_ID] });
}

function assertNodeRule(html, opts, expectedOutcome, occCounts) {
  const result = runNode(html, opts);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule, `expected a checksResults entry for ${RULE_ID}`);
  assert.strictEqual(rule.outcome, expectedOutcome);
  if (occCounts && typeof occCounts.minOccurrences === 'number') {
    assert.ok(rule.occurrences.length >= occCounts.minOccurrences);
  }
  if (occCounts && typeof occCounts.maxOccurrences === 'number') {
    assert.ok(rule.occurrences.length <= occCounts.maxOccurrences);
  }
  return rule;
}

test(`${RULE_ID}: notApplicable when the page has an h1`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the page has role="heading" aria-level="1"`, () => {
  const html = `<!doctype html><html><body><div role="heading" aria-level="1">Title</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the page has headings but no level-one heading`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`${RULE_ID}: cantTell when the page has no heading at all`, () => {
  const html = `<!doctype html><html><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only h1 sits inside a display:none ancestor (CDC's flu page, real-world finding)`, () => {
  const html = `<!doctype html><html><body><div style="display:none"><h1>Influenza (Flu)</h1></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`${RULE_ID}: cantTell when the only h1 has aria-hidden="true"`, () => {
  const html = `<!doctype html><html><body><h1 aria-hidden="true">Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only h1 has visibility:hidden`, () => {
  const html = `<!doctype html><html><body><h1 style="visibility:hidden">Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the h1 is only visually clipped off-screen but remains in the accessibility tree (eBay's homepage pattern — must NOT regress)`, () => {
  const html = `<!doctype html><html><body><h1 style="position:absolute;clip-path:inset(50%);visibility:visible">Site title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page should have a level-one heading');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-has-heading-one-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'page-has-heading-one-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`page-has-heading-one: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['page-has-heading-one'], contextSelector: 'body' });
  assertRule(result, 'page-has-heading-one', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`page-has-heading-one: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['page-has-heading-one'], engineOptions: { fragment: true } });
  assertRule(result, 'page-has-heading-one', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): notApplicable when the page has an h1`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1></body></html>`;
  assertNodeRule(html, {}, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): notApplicable when the page has role="heading" aria-level="1"`, () => {
  const html = `<!doctype html><html><body><div role="heading" aria-level="1">Title</div></body></html>`;
  assertNodeRule(html, {}, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): cantTell when a role="heading" has the wrong aria-level`, () => {
  const html = `<!doctype html><html><body><div role="heading" aria-level="2">Section</div></body></html>`;
  const rule = assertNodeRule(html, {}, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`${RULE_ID} (node runtime): cantTell when an element has a non-heading role (explicit role short-circuits the <h1> tag fallback)`, () => {
  const html = `<!doctype html><html><body><div role="button">Not a heading</div></body></html>`;
  assertNodeRule(html, {}, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID} (node runtime): cantTell when the only h1 sits inside a display:none ancestor`, () => {
  const html = `<!doctype html><html><body><div style="display:none"><h1>Hidden</h1></div></body></html>`;
  assertNodeRule(html, {}, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID} (node runtime): cantTell when the only h1 has aria-hidden="true"`, () => {
  const html = `<!doctype html><html><body><h1 aria-hidden="true">Title</h1></body></html>`;
  assertNodeRule(html, {}, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID} (node runtime): notApplicable when the h1 is only visually clipped off-screen but remains in the accessibility tree`, () => {
  const html = `<!doctype html><html><body><h1 style="position:absolute;clip-path:inset(50%);visibility:visible">Site title</h1></body></html>`;
  assertNodeRule(html, {}, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
