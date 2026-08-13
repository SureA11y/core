'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-roles-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role="" is empty/whitespace`, () => {
  const html = `<!doctype html><html><body><div id="a" role="   "></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role is a valid concrete role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="text" (ARIA 1.2 concrete role, also checked by aria-text)`, () => {
  const html = `<!doctype html><html><body><span id="a" role="text">Plain text</span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when first token of a fallback role list is valid`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for graphics-document/graphics-object/graphics-symbol (WAI-ARIA Graphics Module 1.0, a separate REC-status module from core ARIA 1.2)`, () => {
  const html = `<!doctype html><html><body>
    <svg id="a" role="graphics-symbol" viewBox="0 0 20 20"></svg>
    <div id="b" role="graphics-object"></div>
    <div id="c" role="graphics-document"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when first token of a fallback role list is graphics-symbol (real-world pattern, behance.net primary nav)`, () => {
  const html = `<!doctype html><html><body><svg id="a" role="graphics-symbol img" viewBox="0 0 20 20"></svg></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role does not exist (typo)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="buton"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ROLE_INVALID');
});

test(`${RULE_ID}: fail when role is abstract`, () => {
  const html = `<!doctype html><html><body><div id="a" role="widget"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ROLE_ABSTRACT');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="buton"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'role attribute must be a valid, non-abstract ARIA role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-roles-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-roles-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFailIds = ['arv_case_03', 'arv_case_04'];
  const expectedNoOccIds = [
    'arv_case_01',
    'arv_case_02',
    'arv_case_05',
    'arv_case_06',
    'arv_case_07'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// role takes a fallback list: the first token the browser recognises wins, so
// the rule fails only when no token names a concrete role (ACT 674b10).
test(`${RULE_ID}: a fallback list passes when any token is a concrete role`, () => {
  for (const role of ['searchfield searchbox', 'doc-biblioref link', 'link bogus']) {
    const html = `<!doctype html><html><body><div role="${role}" aria-label="x">t</div></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a fallback list fails when no token is a concrete role`, () => {
  const html = `<!doctype html><html><body><div role="bogus alsobogus" aria-label="x">t</div></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1
  });
});

test(`${RULE_ID}: Digital Publishing and ARIA 1.3 roles are recognised`, () => {
  for (const role of ['doc-biblioref', 'doc-abstract', 'comment', 'suggestion', 'text']) {
    const html = `<!doctype html><html><body><div role="${role}" aria-label="x">t</div></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: notApplicable for a programmatically hidden element`, () => {
  for (const markup of [
    '<div aria-hidden="true" role="bogus">x</div>',
    '<div style="display:none" role="bogus">x</div>',
    '<div aria-hidden="true"><span role="bogus">x</span></div>'
  ]) {
    const html = `<!doctype html><html><body>${markup}</body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});
