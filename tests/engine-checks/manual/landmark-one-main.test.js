'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'landmark-one-main';

// The rest of this file drives every scenario through runa11yCoreOnHtml (the
// toString-embedded in-page runner), which Node's --experimental-test-coverage
// can't attribute back to this file (see tests/node-runtime-parity.test.js's
// header comment). That generic harness runs this rule's own
// "-all-scenarios.html" fixture through the real require()-based entry point
// once, but that fixture's only landmark-shaped element is a <nav> (no
// main/[role]), so it never exercises isMainLandmark/getExplicitRoleToken/
// isExposedToAt. Re-running a few scenarios above through runDomRulesInPage
// directly closes that gap, same pattern as page-has-heading-one's own fix.
function assertNodeRule(html, expectedOutcome, occCounts) {
  createDom(html);
  const result = runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
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

test(`${RULE_ID}: notApplicable when there is exactly one main`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when there is no main at all`, () => {
  const html = `<!doctype html><html><body><nav>Nav only</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_MAIN_MISSING');
});

// Presence-only, matching a reference engine's real landmark-one-main scope exactly (its
// page-has-main check is a plain descendant-exists test, confirmed by reading that engine's
// source directly) -- "more than one main" is landmark-no-duplicate-main's job, a
// fully separate rule, matching that same reference engine shipping landmark-one-main/
// landmark-no-duplicate-main as two distinct checks. See this rule's own header comment for
// the real page (Resy, DuckDuckGo) that exposed the previous, wrongly diverging "also flag
// multiple" branch.
test(`${RULE_ID}: notApplicable when more than one main exists (out of this rule's scope)`, () => {
  const html = `<!doctype html><html><body><main id="a">A</main><main id="b">B</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the only main is hidden from the accessibility tree`, () => {
  const html = `<!doctype html><html><body><main aria-hidden="true">Hidden</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_MAIN_MISSING');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><nav>Nav only</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page should have a main landmark');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-one-main-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'landmark-one-main-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_MAIN_MISSING');
});

test(`landmark-one-main: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body><nav>Nav only</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['landmark-one-main'], contextSelector: 'body' });
  assertRule(result, 'landmark-one-main', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`landmark-one-main: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body><nav>Nav only</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['landmark-one-main'], engineOptions: { fragment: true } });
  assertRule(result, 'landmark-one-main', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): notApplicable when there is exactly one <main>`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  assertNodeRule(html, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): notApplicable when there is one role="main"`, () => {
  const html = `<!doctype html><html><body><div role="main">Content</div></body></html>`;
  assertNodeRule(html, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): notApplicable when more than one main exists (out of this rule's scope)`, () => {
  const html = `<!doctype html><html><body><main id="a">A</main><main id="b">B</main></body></html>`;
  assertNodeRule(html, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID} (node runtime): cantTell when a non-main role is present (explicit role short-circuits the <main> tag fallback)`, () => {
  const html = `<!doctype html><html><body><div role="navigation">Nav</div></body></html>`;
  assertNodeRule(html, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID} (node runtime): cantTell when the only main is hidden from the accessibility tree`, () => {
  const html = `<!doctype html><html><body><main aria-hidden="true">Hidden</main></body></html>`;
  assertNodeRule(html, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
