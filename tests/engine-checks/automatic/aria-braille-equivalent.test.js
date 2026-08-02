'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-braille-equivalent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element uses a braille-specific attribute`, () => {
  const html = `<!doctype html><html><body><button>Plain</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-braillelabel is accompanied by visible text content`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save">Save</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-braillelabel has no accessible name at all`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BRAILLE_ATTR_WITHOUT_EQUIVALENT');
});

test(`${RULE_ID}: fail when aria-brailleroledescription has no aria-roledescription`, () => {
  const html = `<!doctype html><html><body><div role="img" aria-brailleroledescription="pic" aria-label="cat">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when aria-brailleroledescription is accompanied by aria-roledescription`, () => {
  const html = `<!doctype html><html><body><div role="img" aria-brailleroledescription="pic" aria-roledescription="picture" aria-label="cat">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-braille-equivalent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-braille-equivalent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFailIds = ['abe_case_04', 'abe_case_05'];
  const expectedNoOccIds = ['abe_case_01', 'abe_case_02', 'abe_case_03', 'abe_case_06'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
