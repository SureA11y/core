'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'landmark-complementary-is-top-level';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no complementary landmark is present`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the complementary landmark is top-level`, () => {
  const html = `<!doctype html><html><body><aside id="a">Related</aside><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when an explicit role="complementary" sits inside another landmark`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Sections"><div role="complementary" id="a">Related</div></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_COMPLEMENTARY_NOT_TOP_LEVEL');
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: cantTell when a named <aside> inside <main> keeps its complementary role`, () => {
  const html = `<!doctype html><html><body><main><aside aria-label="Further reading" id="a">Related</aside></main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when an unnamed <aside> inside sectioning content has no complementary role to nest`, () => {
  // Per HTML-AAM the role is suppressed there, so reporting it would name a
  // landmark that does not exist -- the same reasoning the <header> sibling uses.
  const html = `<!doctype html><html><body><article><aside id="a">Pull quote</aside></article></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when an <aside>'s role is overridden away from complementary`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Host"><aside role="note" id="a">Not a landmark</aside></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a nested complementary hidden from the accessibility tree is not reported`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Host"><aside aria-label="Hidden" aria-hidden="true" id="a">Related</aside></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: the ancestor walk stops at the scanned scope`, () => {
  // Scoped to the aside's own wrapper, the enclosing <nav> is outside the scan
  // and must not count as the landmark ancestor.
  const html = `<!doctype html><html><body><nav aria-label="Outer"><div id="scope"><aside aria-label="Related" id="a">Related</aside></div></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], contextSelector: '#scope' });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Sections"><div role="complementary" id="a">Related</div></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Complementary landmark must be top-level');
  assert.strictEqual(
    rule.occurrences[0].summary,
    'This complementary landmark is nested inside another landmark region.'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-complementary-is-top-level-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'landmark-complementary-is-top-level-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  for (const id of ['lctl_case_03', 'lctl_case_04']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'lctl_case_01',
    'lctl_case_02',
    'lctl_case_05',
    'lctl_case_06',
    'lctl_case_07'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
