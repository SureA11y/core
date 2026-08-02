'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'nested-interactive-controls-absent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no interactive control is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a plain button`, () => {
  const html = `<!doctype html><html><body><button>Click me</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a button contains a checkbox`, () => {
  const html = `<!doctype html><html><body><button id="a"><input type="checkbox"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.nestedElements, ['input']);
});

test(`${RULE_ID}: fail when a link contains a button`, () => {
  const html = `<!doctype html><html><body><a id="b" href="/x">Text <button>nested</button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: the nested-descendant search used the raw native
// querySelectorAll, not helpers.queryAllSmart, so it wasn't subject to
// ANY hidden-content filtering at all -- not even hard CSS-based hiding,
// let alone aria-hidden. A nested descendant that is never actually
// rendered or exposed to AT creates no real ambiguity for any user, since
// it isn't there to be confused with the outer control.
test(`${RULE_ID}: a display:none nested control is not flagged (it is never rendered at all)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Text <button style="display:none">nested</button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an aria-hidden, non-focusable nested control is not flagged (it is not exposed to AT)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Text <span role="checkbox" aria-hidden="true">nested</span></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><button id="a"><input type="checkbox"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Interactive controls must not be nested');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/nested-interactive-controls-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'nested-interactive-controls-absent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFailIds = ['nic_case_03', 'nic_case_04', 'nic_case_05'];
  const expectedNoOccIds = ['nic_case_01', 'nic_case_02'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
