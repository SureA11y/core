'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'form-control-single-label';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no labelable control is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass with a single wrapping label`, () => {
  const html = `<!doctype html><html><body><label>Name <input type="text"></label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass with a single label[for]`, () => {
  const html = `<!doctype html><html><body><label for="x">Name</label><input id="x" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a label both wraps and self-references (dedup, not double-counted)`, () => {
  const html = `<!doctype html><html><body><label for="z">Name<input id="z" type="text"></label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when two label[for] point at the same control`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><label for="y">Name2</label><input id="y" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.labelCount, 2);
});

test(`${RULE_ID}: pass when the second label[for] is display:none (not AT-eligible)`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><input id="y" type="text"><label for="y" style="display:none">Hidden duplicate</label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the second label[for] is aria-hidden (not AT-eligible)`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><input id="y" type="text"><label for="y" aria-hidden="true">Hidden duplicate</label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: still fails when both duplicate label[for] are AT-eligible (hiding one doesn't suppress a genuine visible duplicate)`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><label for="y">Name2</label><input id="y" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.labelCount, 2);
});

test(`${RULE_ID}: pass when aria-label overrides multiple empty labels (selectable-card pattern)`, () => {
  const html = `<!doctype html><html><body><div><label for="r"></label></div><label for="r"><input id="r" type="radio" aria-label="Internal Entity Person"><span></span></label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-labelledby overrides two non-empty labels`, () => {
  const html = `<!doctype html><html><body><span id="nm">Chosen name</span><label for="r2">Foo</label><label for="r2">Bar</label><input id="r2" type="text" aria-labelledby="nm"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when one real label plus an empty label[for] and no override`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><label for="y"></label><input id="y" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].occurrenceOutcome, 'cantTell');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FORM_FIELD_EXTRA_EMPTY_LABEL');
});

test(`${RULE_ID}: pass when every associated label is empty and there is no override`, () => {
  const html = `<!doctype html><html><body><label for="e"></label><label for="e"></label><input id="e" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><label for="y">Name</label><label for="y">Name2</label><input id="y" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Form controls must not have multiple labels');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-control-single-label-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-control-single-label-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFailIds = ['fcsl_case_04', 'fcsl_case_05'];
  const expectedCantTellIds = ['fcsl_case_09'];
  const expectedNoOccIds = [
    'fcsl_case_01',
    'fcsl_case_02',
    'fcsl_case_03',
    'fcsl_case_06',
    'fcsl_case_07',
    'fcsl_case_08'
  ];

  const outcomeForId = (id) =>
    (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    )?.occurrenceOutcome;

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
    assert.strictEqual(outcomeForId(id), 'fail', `Expected fail occurrence for id="${id}"`);
  }
  for (const id of expectedCantTellIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
    assert.strictEqual(outcomeForId(id), 'cantTell', `Expected cantTell occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
