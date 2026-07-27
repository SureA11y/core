'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-allowed-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-label="Hello"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role is not modeled in the supported-attrs table`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when only global aria-* attributes are present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-label="Agree" aria-hidden="false"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-* attribute is supported by the role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-* attribute is not permitted for the role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-valuenow');
  assert.equal(rule.occurrences[0].data.details.role, 'checkbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_NOT_ALLOWED');
});

test(`${RULE_ID}: notApplicable when role has an unknown/invalid role token`, () => {
  const html = `<!doctype html><html><body><div id="a" role="buton" aria-label="Hello"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: reports one occurrence per disallowed attribute on the same element`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1" aria-valuemin="0"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const attrs = rule.occurrences.map((o) => o.data.details.attr).sort();
  assert.deepStrictEqual(attrs, ['aria-valuemin', 'aria-valuenow']);
});

test(`${RULE_ID}: pass when aria-modal is present on role="dialog" (widened 2026-07-21 — verified against a reference engine's own allowedAttrs table)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="dialog" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-modal is present on role="alertdialog"`, () => {
  const html = `<!doctype html><html><body><div id="a" role="alertdialog" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="searchbox" has textbox-family attrs (searchbox is textbox's ARIA subclass)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="searchbox" aria-multiline="false" aria-autocomplete="list"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="meter" has aria-valuetext (widened 2026-07-21, pairs with the aria-required-attr valuenow requirement)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="42" aria-valuetext="42 percent"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="columnheader"/"rowheader" have aria-sort`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="columnheader" aria-sort="ascending"></div>
    <div id="b" role="rowheader" aria-sort="descending"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="listitem" has level/posinset/setsize`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listitem" aria-level="2" aria-posinset="1" aria-setsize="5"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="menu"/"menubar"/"toolbar" have activedescendant/orientation`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="menu" aria-activedescendant="x" aria-orientation="vertical"></div>
    <div id="b" role="menubar" aria-orientation="horizontal"></div>
    <div id="c" role="toolbar" aria-activedescendant="y"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-modal is present on a role that doesn't support it (role="checkbox")`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-modal');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'aria-* attributes must be permitted for the element’s role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-allowed-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-allowed-attr-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFailIds = ['aaa_case_03', 'aaa_case_04', 'aaa_case_13'];
  const expectedNoOccIds = [
    'aaa_case_01', 'aaa_case_02', 'aaa_case_05', 'aaa_case_06',
    'aaa_case_07a', 'aaa_case_07b', 'aaa_case_08', 'aaa_case_09',
    'aaa_case_10a', 'aaa_case_10b', 'aaa_case_11',
    'aaa_case_12a', 'aaa_case_12b', 'aaa_case_12c'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});