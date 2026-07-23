'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-landmark-one-main';

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

// Presence-only, matching the reference engine's real landmark-one-main scope exactly (its page-has-main
// check is a plain descendant-exists test, confirmed by reading its source directly) -- "more than
// one main" is a11ycore-landmark-no-duplicate-main's job, a fully separate rule, matching the reference engine
// shipping landmark-one-main/landmark-no-duplicate-main as two distinct checks. See this rule's
// own header comment for the real page (Resy, DuckDuckGo) that exposed the previous, wrongly
// reference-engine-disagreeing "also flag multiple" branch.
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
