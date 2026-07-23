'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-listitem-parent-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no li is present`, () => {
  const html = `<!doctype html><html><body><div>no items</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside ul`, () => {
  const html = `<!doctype html><html><body><ul><li>a</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside ol`, () => {
  const html = `<!doctype html><html><body><ol><li>a</li></ol></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside role="list"`, () => {
  const html = `<!doctype html><html><body><div role="list"><li>a</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when li's parent is a <ul> with an explicit role="menu" (the explicit role overrides the tag's native "list" role — found on a real site, Nike's desktop nav dropdown)`, () => {
  const html = `<!doctype html><html><body><ul role="menu"><li id="a">orphan</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when li's parent is a <ul> with an explicit role="presentation" (list semantics deliberately suppressed, matches the reference engine's own listitem check)`, () => {
  const html = `<!doctype html><html><body><ul role="presentation"><li id="a">item</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li's parent is an <ol> with an explicit role="none"`, () => {
  const html = `<!doctype html><html><body><ol role="none"><li id="a">item</li></ol></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when li's parent is a plain div`, () => {
  const html = `<!doctype html><html><body><div><li id="a">orphan</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.parentElement, 'div');
});

test(`${RULE_ID}: reports one occurrence per orphaned li`, () => {
  const html = `<!doctype html><html><body><div><li id="a">a</li><li id="b">b</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div><li id="a">orphan</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'List items must be inside a list container');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/listitem-parent-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'listitem-parent-valid-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedFailIds = ['lpv_case_04', 'lpv_case_05', 'lpv_case_06', 'lpv_case_09'];
  const expectedNoOccIds = ['lpv_case_01', 'lpv_case_02', 'lpv_case_03', 'lpv_case_07', 'lpv_case_08'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});