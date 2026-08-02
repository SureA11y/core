'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'accesskeys';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no accesskey is present`, () => {
  const html = `<!doctype html><html><body><a href="/a">A</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when accesskeys are distinct`, () => {
  const html = `<!doctype html><html><body><a href="/a" accesskey="a">A</a><a href="/b" accesskey="b">B</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell with one occurrence per element sharing an accesskey`, () => {
  const html = `<!doctype html><html><body><a href="/1" id="a" accesskey="s">1</a><a href="/2" id="b" accesskey="s">2</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ACCESSKEY_DUPLICATE');
});

test(`${RULE_ID}: notApplicable when duplicate accesskeys differ only by a hidden copy (default hidden filtering)`, () => {
  const html = `<!doctype html><html><body><a href="/1" id="visible" accesskey="f">Search</a><nav style="display:none"><a href="/2" id="hidden" accesskey="f">Search hidden copy</a></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when includeHiddenElements=true and duplicate accesskeys include hidden copy`, () => {
  const html = `<!doctype html><html><body><a href="/1" id="visible" accesskey="f">Search</a><nav style="display:none"><a href="/2" id="hidden" accesskey="f">Search hidden copy</a></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { includeHiddenElements: true }
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'visible'));
  assert.ok(hasOccurrenceForId(rule, 'hidden'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a href="/1" id="a" accesskey="s">1</a><a href="/2" id="b" accesskey="s">2</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'accesskey values must be unique');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/accesskeys-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'accesskeys-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'ak_case_02a'));
  assert.ok(hasOccurrenceForId(rule, 'ak_case_02b'));
  assert.ok(!hasOccurrenceForId(rule, 'ak_case_01a'));
  assert.ok(!hasOccurrenceForId(rule, 'ak_case_03a'));
  assert.ok(!hasOccurrenceForId(rule, 'ak_case_03b'));
});
