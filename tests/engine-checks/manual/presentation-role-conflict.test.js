'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'presentation-role-conflict';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no role="presentation"/"none" is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role="presentation" has no naming attribute`, () => {
  const html = `<!doctype html><html><body><div role="presentation"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when role="presentation" has aria-label`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation" aria-label="x"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'PRESENTATION_ROLE_CONFLICT');
});

test(`${RULE_ID}: cantTell when role="none" has aria-describedby`, () => {
  const html = `<!doctype html><html><body><span id="d">D</span><div id="a" role="none" aria-describedby="d"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: cantTell when role="presentation" is on a natively focusable element`, () => {
  const html = `<!doctype html><html><body><button id="a" role="presentation"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.focusable, true);
});

test(`${RULE_ID}: cantTell when role="none" has tabindex="0"`, () => {
  const html = `<!doctype html><html><body><div id="a" role="none" tabindex="0"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when role="presentation" is on a disabled (non-focusable) button`, () => {
  const html = `<!doctype html><html><body><button id="a" role="presentation" disabled></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when <img alt=""> has aria-hidden="" (empty value, but still a specified global ARIA attribute — presence, not value, triggers the conflict; found on a real site, Slack's homepage)`, () => {
  const html = `<!doctype html><html><body><img id="a" src="x.png" alt="" aria-hidden=""></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.conflictingAttrs, ['aria-hidden']);
});

test(`${RULE_ID}: notApplicable when <img alt=""> has no conflicting attribute`, () => {
  const html = `<!doctype html><html><body><img id="a" src="x.png" alt=""></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when <img> has a non-empty alt (out of scope — not an implicit presentation role)`, () => {
  const html = `<!doctype html><html><body><img id="a" src="x.png" alt="A description"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when role="presentation" combined with aria-current (a global ARIA attribute outside the narrow naming-only set this rule originally checked)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation" aria-current="page"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation" aria-label="x"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Presentational role must not conflict with a global ARIA attribute or focusability');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/presentation-role-conflict-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'presentation-role-conflict-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });
  for (const id of ['prc_case_02', 'prc_case_03', 'prc_case_04', 'prc_case_05', 'prc_case_07', 'prc_case_10']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of ['prc_case_01', 'prc_case_06', 'prc_case_08', 'prc_case_09']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
