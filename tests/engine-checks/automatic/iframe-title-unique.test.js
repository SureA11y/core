'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-iframe-title-unique';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no iframe/frame has a title attribute`, () => {
  const html = `<!doctype html><html><body><iframe id="a"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a single frame has a title`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Chat widget"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when multiple frames have distinct titles`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Chat"></iframe><iframe id="b" title="Ads"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when two frames share the same title`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Widget"></iframe><iframe id="b" title="Widget"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'IFRAME_TITLE_DUPLICATE');
  assert.equal(rule.occurrences[0].data.details.title, 'Widget');
});

test(`${RULE_ID}: fail flags only the duplicated group when a third frame has a distinct title`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Widget"></iframe><iframe id="b" title="Widget"></iframe><iframe id="c" title="Unique"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(!hasOccurrenceForId(rule, 'c'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Widget"></iframe><iframe id="b" title="Widget"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Frame titles must be unique');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/iframe-title-unique-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'iframe-title-unique-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFailIds = ['ifu_case_02', 'ifu_case_03'];
  const expectedNoOccIds = ['ifu_case_01', 'ifu_case_04'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});