'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'skip-link';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when there is no skip-like link`, () => {
  const html = `<!doctype html><html><body><a href="/about">About</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the skip link target resolves`, () => {
  const html = `<!doctype html><html><body><a href="#main">Skip to content</a><div id="main">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the skip link target exists but is hidden/ineligible`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#main">Skip to content</a><div style="display:none"><main id="main">Content</main></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SKIP_LINK_TARGET_UNUSABLE');
  assert.equal(rule.occurrences[0].data.details.unusableReasonCode, 'ACC_TREE_INELIGIBLE');
});

test(`${RULE_ID}: cantTell when the skip link target does not exist`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#missing">Skip to main content</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SKIP_LINK_TARGET_MISSING');
});

test(`${RULE_ID}: cantTell when a "Jump to ..." link (not literally containing "skip") has a missing target (found on a real site — Wish.com's homepage, 2026-07-23: <a href="#jump-menu">Jump to section</a> with no #jump-menu anywhere in the document; a reference engine's own skip-link matching is purely positional, not text-based, so it caught this while the original "skip"-only text pattern here missed it entirely)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#jump-menu">Jump to section</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when a "Jump to ..." link's target resolves`, () => {
  const html = `<!doctype html><html><body><a href="#main">Jump to main content</a><div id="main">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#missing">Skip to main content</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Skip link must have a resolvable, usable target');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/skip-link-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'skip-link-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.ok(hasOccurrenceForId(rule, 'sl_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'sl_case_04'));
  assert.ok(hasOccurrenceForId(rule, 'sl_case_06'));
  assert.ok(!hasOccurrenceForId(rule, 'sl_case_01'));
  assert.ok(!hasOccurrenceForId(rule, 'sl_case_03'));
  assert.ok(!hasOccurrenceForId(rule, 'sl_case_05'));
});
