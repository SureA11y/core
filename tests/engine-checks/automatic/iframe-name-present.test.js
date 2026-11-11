'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'iframe-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no iframe/frame present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when title attribute is present`, () => {
  const html = `<!doctype html><html><body><iframe id="a" title="Chat widget"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-label is present`, () => {
  const html = `<!doctype html><html><body><iframe id="a" aria-label="Chat widget"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when no accessible name is present`, () => {
  const html = `<!doctype html><html><body><iframe id="a"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'IFRAME_NAME_MISSING');
});

test(`${RULE_ID}: fail does not fall back to iframe rendered content`, () => {
  const html = `<!doctype html><html><body><iframe id="a">Fallback text for old browsers</iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the iframe is not accessibility-tree eligible (aria-hidden)`, () => {
  const html = `<!doctype html><html><body><iframe id="a" aria-hidden="true"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><iframe id="a"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Frames have an accessible name');
});

test(`${RULE_ID}: notApplicable for an iframe marked decorative, though it stays focusable (W3C's ACT cae760, Inapplicable Example 4)`, () => {
  for (const role of ['none', 'presentation']) {
    const html = `<!doctype html><html><body><iframe id="a" role="${role}" src="/x.html"></iframe></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: notApplicable for an iframe marked decorative AND out of the tab order (role="none" + tabindex="-1")`, () => {
  const html = `<!doctype html><html><body><iframe id="a" role="none" tabindex="-1" src="/x.html"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a plain iframe with tabindex="-1" and no role at all: ACT cae760's applicability requires accessibility-tree eligibility AND sequential focus navigation unconditionally, not only as a role="none" exception`, () => {
  const html = `<!doctype html><html><body><iframe id="a" tabindex="-1" src="/x.html"></iframe></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/iframe-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'iframe-name-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFailIds = ['ifn_case_04', 'ifn_case_05'];
  const expectedNoOccIds = [
    'ifn_case_01',
    'ifn_case_02',
    'ifn_case_03',
    'ifn_case_06',
    'ifn_case_07',
    'ifn_case_08',
    'ifn_case_09'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: a fail says when aria-labelledby points to a missing id`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
  <h2 id="maphead">Map</h2>
  <iframe id="f1" src="about:blank" aria-labelledby="map-head"></iframe>
</body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  assert.equal(occ('f1').i18n.hintKey, 'nameCause_hint_labelledbyMissing');
  assert.equal(
    occ('f1').hint,
    'Its aria-labelledby points to "map-head", which no element on the page has, so it gives no name. Point it at the id of the element whose text names it, or name it with aria-label.'
  );
  assert.equal(occ('f1').data.details.nameCause.cause, 'labelledbyMissing');
});
