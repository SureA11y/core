'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'iframe-title-unique';

const BASE = 'https://example.test/';

function run(body) {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  return runa11yCoreOnHtml(html, { runOnly: [RULE_ID], url: BASE });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no iframe/frame has a title attribute`, () => {
  const result = run('<iframe id="a" src="/one.html"></iframe>');
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a single frame has a title`, () => {
  const result = run('<iframe id="a" title="Chat widget" src="/one.html"></iframe>');
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when multiple frames have distinct titles`, () => {
  const result = run(
    '<iframe id="a" title="Chat" src="/one.html"></iframe><iframe id="b" title="Ads" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ACT 4b1c6c Passed Example 1: one title, one resource.
test(`${RULE_ID}: pass when frames sharing a title embed the same resource`, () => {
  const result = run(
    '<iframe id="a" title="List of Contributors" src="/page-one.html"></iframe><iframe id="b" title="List of Contributors" src="/page-one.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ACT 4b1c6c Passed Example 6.
test(`${RULE_ID}: a trailing slash does not make a second resource`, () => {
  const result = run(
    '<iframe id="a" title="Contact us" src="/sub-dir/"></iframe><iframe id="b" title="Contact us" src="/sub-dir"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a fragment does not make a second resource`, () => {
  const result = run(
    '<iframe id="a" title="Contributors" src="/one.html#top"></iframe><iframe id="b" title="Contributors" src="/one.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ACT 4b1c6c Passed Example 4: equivalent content under two paths. The markup
// cannot tell equivalent from different, so this is cantTell, never fail.
test(`${RULE_ID}: cantTell, never fail, when frames sharing a title embed different resources`, () => {
  const result = run(
    '<iframe id="a" title="Contact us" src="/page-one.html"></iframe><iframe id="b" title="Contact us" src="/sub-dir/page-one.html"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.data.details.reasonCode, 'IFRAME_TITLE_DUPLICATE');
    assert.strictEqual(occ.data.details.title, 'Contact us');
    assert.strictEqual(occ.data.details.duplicateCount, 2);
    assert.strictEqual(occ.uncertainty.code, 'equivalence-unknown');
    assert.strictEqual(occ.uncertainty.evidence.otherResources.length, 1);
  }
  assert.strictEqual(
    rule.occurrences[0].uncertainty.evidence.resource,
    'https://example.test/page-one.html'
  );
  assert.deepStrictEqual(rule.occurrences[0].uncertainty.evidence.otherResources, [
    'https://example.test/sub-dir/page-one.html'
  ]);
});

test(`${RULE_ID}: a frame with no src cannot be shown to embed the same resource`, () => {
  const result = run(
    '<iframe id="a" title="Notes" src="/one.html"></iframe><iframe id="b" title="Notes" srcdoc="<p>hi</p>"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const byId = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  assert.strictEqual(byId('a').uncertainty.code, 'equivalence-unknown');
  assert.strictEqual(byId('b').uncertainty.code, 'not-computable');
  assert.strictEqual(byId('b').data.details.reasonCode, 'IFRAME_TITLE_DUPLICATE');
});

test(`${RULE_ID}: only the set whose resources differ is reported`, () => {
  const result = run(
    '<iframe id="a" title="Widget" src="/one.html"></iframe><iframe id="b" title="Widget" src="/two.html"></iframe>' +
      '<iframe id="c" title="Unique" src="/three.html"></iframe>' +
      '<iframe id="d" title="Same" src="/four.html"></iframe><iframe id="e" title="Same" src="/four.html"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.ok(!hasOccurrenceForId(rule, 'c'));
  assert.ok(!hasOccurrenceForId(rule, 'd'));
  assert.ok(!hasOccurrenceForId(rule, 'e'));
});

// ACT 4b1c6c Inapplicable Example 5: a frame hidden from the accessibility tree
// is not part of a set, so the one frame left standing has nothing to share with.
test(`${RULE_ID}: a frame hidden from the accessibility tree is not part of a set`, () => {
  const result = run(
    '<iframe id="a" aria-hidden="true" title="List of Contributors" src="/one.html"></iframe><iframe id="b" title="List of Contributors" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: compares the title attribute even when aria-label overrides the name`, () => {
  const result = run(
    '<iframe id="a" title="Widget" aria-label="First" src="/one.html"></iframe><iframe id="b" title="Widget" aria-label="Second" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = run(
    '<iframe id="a" title="Widget" src="/one.html"></iframe><iframe id="b" title="Widget" src="/two.html"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Frames sharing a title embed the same resource');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/iframe-title-unique-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'iframe-title-unique-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID], url: BASE });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expectedCantTellIds = ['ifu_case_08', 'ifu_case_09', 'ifu_case_10', 'ifu_case_11'];
  const expectedNoOccIds = [
    'ifu_case_01',
    'ifu_case_02',
    'ifu_case_03',
    'ifu_case_04',
    'ifu_case_05',
    'ifu_case_06',
    'ifu_case_07',
    'ifu_case_12',
    'ifu_case_13'
  ];

  for (const id of expectedCantTellIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.data.details.reasonCode, 'IFRAME_TITLE_DUPLICATE');
    assert.ok(occ.uncertainty && occ.uncertainty.code, 'every cantTell occurrence says why');
  }
});
