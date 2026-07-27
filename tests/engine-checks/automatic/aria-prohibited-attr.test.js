'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-prohibited-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-label="Hello"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role does not prohibit naming`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button" aria-label="Submit"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a naming-prohibited role has no naming attribute`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-label is present on a naming-prohibited role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
  assert.equal(rule.occurrences[0].data.details.role, 'generic');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_PROHIBITED');
});

test(`${RULE_ID}: fail when aria-labelledby is present on a naming-prohibited role`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><strong id="a" role="strong" aria-labelledby="lbl"></strong></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-labelledby');
});

test(`${RULE_ID}: fail when aria-label is present on role="mark" (widened role, Tier 4)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="mark" aria-label="Highlighted"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'mark');
});

test(`${RULE_ID}: fail when aria-label is present on role="presentation" (widened 2026-07-21 — verified against a reference engine's own prohibitedAttrs table)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'presentation');
});

test(`${RULE_ID}: fail when aria-labelledby is present on role="none" (widened 2026-07-21 — "none" is "presentation"'s ARIA 1.2 alias)`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><div id="a" role="none" aria-labelledby="lbl"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'none');
});

test(`${RULE_ID}: reports one occurrence per prohibited naming attribute on the same element`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><div id="a" role="paragraph" aria-label="Something" aria-labelledby="lbl"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const attrs = rule.occurrences.map((o) => o.data.details.attr).sort();
  assert.deepStrictEqual(attrs, ['aria-label', 'aria-labelledby']);
});

test(`${RULE_ID}: pass when naming attribute is empty/whitespace`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="   "></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'ARIA naming attributes must not be used on roles that prohibit them');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-prohibited-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-prohibited-attr-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = ['apa_case_03', 'apa_case_04', 'apa_case_05', 'apa_case_07', 'apa_case_08', 'apa_case_09'];
  const expectedNoOccIds = ['apa_case_01', 'apa_case_02', 'apa_case_06'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});