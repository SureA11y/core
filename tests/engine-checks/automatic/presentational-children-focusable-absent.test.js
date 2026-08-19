'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'presentational-children-focusable-absent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role with presentational children is present`, () => {
  const html = `<!doctype html><html><body><div><a href="/x">Link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a button holding text only`, () => {
  const html = `<!doctype html><html><body><button id="a">Save</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a button contains a tabindex="0" descendant`, () => {
  const html = `<!doctype html><html><body><button id="a">Save <span role="button" tabindex="0">More</span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.role, 'button');
  assert.deepStrictEqual(rule.occurrences[0].data.details.focusableElements, ['span']);
});

test(`${RULE_ID}: fail when role="checkbox" contains a link`, () => {
  const html = `<!doctype html><html><body><p role="checkbox" aria-checked="false" tabindex="0" id="a">I agree to the <a href="/terms">terms</a></p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail for a native role, on the element itself rather than the tab stop`, () => {
  const html = `<!doctype html><html><body><progress id="a" value="30" max="100"><a href="/x">30%</a></progress></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.role, 'progressbar');
});

// ---------------------------------------------------------------------------
// Sequential focus navigation, not focusability in general: tabindex="-1" is
// programmatically focusable but takes no tab stop.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: pass when the descendant carries tabindex="-1"`, () => {
  const html = `<!doctype html><html><body><span role="img" aria-label="art" id="a">*** <span tabindex="-1">x</span> ***</span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the descendant control is disabled`, () => {
  const html = `<!doctype html><html><body><ul role="menu"><li role="menuitemcheckbox" aria-checked="true" id="a"><input type="checkbox" disabled checked> Sort</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for an anchor descendant with no href`, () => {
  const html = `<!doctype html><html><body><button id="a"><a>button/link</a></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the descendant is not rendered`, () => {
  const html = `<!doctype html><html><body><button id="a">Save <a href="/x" style="display:none">details</a></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// Scope boundaries.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: role="presentation" is not the presentational-children mechanism`, () => {
  // An explicit role="presentation"/"none" attribute is a different concern
  // (presentation-role-conflict); it is not one of the roles whose children
  // the accessibility tree drops.
  const html = `<!doctype html><html><body><div role="presentation" id="a"><a href="/x">Link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a role with no presentational children is skipped`, () => {
  const html = `<!doctype html><html><body><a href="https://w3.org" id="a"><span tabindex="0">W3C</span></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: the first valid role token in a fallback list wins`, () => {
  const html = `<!doctype html><html><body><div role="figure tab" id="a"><a href="/x">Link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an unknown role token falls through to the next one`, () => {
  const html = `<!doctype html><html><body><div role="taab tab" id="a"><a href="/x">Link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: an aria-hidden container is left to aria-hidden-focus`, () => {
  const html = `<!doctype html><html><body><button id="a" aria-hidden="true">Save <a href="/x">details</a></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an aria-hidden descendant subtree is left to aria-hidden-focus`, () => {
  const html = `<!doctype html><html><body><button id="a">Save <span aria-hidden="true"><a href="/x">details</a></span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a tab stop is attributed to the nearest presentational-children role`, () => {
  const html = `<!doctype html><html><body><button id="outer">Pick <span role="tab" id="inner"><a href="/x">One</a></span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'inner'));
  assert.ok(!hasOccurrenceForId(rule, 'outer'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><button id="a">Save <span tabindex="0">More</span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Roles with presentational children must not contain focusable content'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/presentational-children-focusable-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'presentational-children-focusable-absent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFailIds = [
    'pcf_case_07',
    'pcf_case_08',
    'pcf_case_09',
    'pcf_case_10',
    'pcf_case_11',
    'pcf_case_12'
  ];
  const expectedNoOccIds = [
    'pcf_case_01',
    'pcf_case_02',
    'pcf_case_03',
    'pcf_case_04',
    'pcf_case_05',
    'pcf_case_06',
    'pcf_case_12_outer',
    'pcf_case_13',
    'pcf_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
