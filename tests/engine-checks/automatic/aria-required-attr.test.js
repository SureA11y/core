'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-aria-required-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role has no required-attrs entry`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the required attribute is present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the required attribute is missing`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-checked');
  assert.equal(rule.occurrences[0].data.details.role, 'checkbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_REQUIRED_MISSING');
});

test(`${RULE_ID}: fail when the required attribute is present but empty`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="   "></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when role has an unknown/invalid role token`, () => {
  const html = `<!doctype html><html><body><div id="a" role="chekbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Roles with a required ARIA state/property must carry it');
});

test(`${RULE_ID}: pass when role="heading" has aria-level present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="2"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="heading" has no aria-level`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-level');
  assert.equal(rule.occurrences[0].data.details.role, 'heading');
});

test(`${RULE_ID}: fail when role="meter" has no aria-valuenow (widened 2026-07-21 — verified against the reference engine's own requiredAttrs table; meter has no "indeterminate" concept unlike progressbar, so this is unconditional)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuemin="0" aria-valuemax="100"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-valuenow');
  assert.equal(rule.occurrences[0].data.details.role, 'meter');
});

test(`${RULE_ID}: pass when role="meter" has aria-valuenow present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="42" aria-valuemin="0" aria-valuemax="100"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role="progressbar" has no aria-valuenow (deliberately NOT required — an indeterminate progressbar legitimately omits it, matching the reference engine's own table)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="progressbar"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for role="combobox" with aria-expanded present but no aria-controls (aria-controls deliberately NOT required unconditionally — only required once the popup is displayed, per MDN's combobox role page; adding it here would risk a false fail)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="combobox" aria-expanded="false"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a native <h2> with no explicit role (implicit level, not this rule's concern)`, () => {
  const html = `<!doctype html><html><body><h2 id="a">Native heading</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-required-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-required-attr-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFailIds = ['ara_case_02', 'ara_case_03', 'ara_case_07', 'ara_case_09'];
  const expectedNoOccIds = [
    'ara_case_01', 'ara_case_04', 'ara_case_05', 'ara_case_06', 'ara_case_08',
    'ara_case_10', 'ara_case_11', 'ara_case_12'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});