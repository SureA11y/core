'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-deprecated-role';

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

test(`${RULE_ID}: notApplicable when role is invalid/abstract (not this rule's concern)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="buton"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role is valid and not deprecated`, () => {
  const html = `<!doctype html><html><body><div id="a" role="list"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role is deprecated`, () => {
  const html = `<!doctype html><html><body><div id="a" role="directory"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ROLE_DEPRECATED');
  assert.match(rule.occurrences[0].hint, /role="list"/);
});

test(`${RULE_ID}: fail when role="generic" is explicitly declared (reserved for user-agent-internal use, not authors — verified against WAI-ARIA 1.2 spec + MDN)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ROLE_DEPRECATED');
  assert.match(rule.occurrences[0].hint, /user-agent-internal/);
});

test(`${RULE_ID}: role="generic" still passes aria-roles-valid (it IS a valid, non-abstract role — just author-prohibited)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-roles-valid'] });
  assertRule(result, 'aria-roles-valid', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="directory"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'role attribute must not use a deprecated or author-prohibited ARIA role'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-deprecated-role-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-deprecated-role-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  for (const id of ['adr_case_02', 'adr_case_04']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of ['adr_case_01', 'adr_case_03']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
