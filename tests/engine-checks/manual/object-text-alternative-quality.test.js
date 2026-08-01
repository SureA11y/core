'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = "object-text-alternative-quality";

// The fixture never uses role="presentation"/"none", so
// isRolePresentationExcluded's focusable-vs-not-focusable branches never run
// through runa11yCoreOnHtml (toString-embedded, uncounted by Node's
// --experimental-test-coverage per tests/node-runtime-parity.test.js's header
// comment) nor through the fixture's single runDomRulesInPage pass -- same
// gap as svg-text-alternative-quality's identical helper.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "object-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expected = [
  "o_q_01",
  "o_q_02",
  "o_q_04",
  "o_q_06",
  "o_q_10"
];
  const notExpected = [
  "o_q_03",
  "o_q_05",
  "o_q_07",
  "o_q_08",
  "o_q_09"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "object-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, "<object> : alternative textuelle \u00e0 v\u00e9rifier (revue manuelle)");
  assert.strictEqual(rule.description, "Signale les \u00e9l\u00e9ments <object> avec contenu de secours ou nom d\u00e9tect\u00e9, afin de v\u00e9rifier manuellement l\u2019\u00e9quivalence.");

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, "V\u00e9rifiez l\u2019alternative textuelle de <object> (\u00e9quivalence et pertinence).");
  assert.strictEqual(occ.hint, "Confirmez que le contenu de secours ou le nom ARIA fournit une alternative \u00e9quivalente au contenu embarqu\u00e9.");
});

test(`${RULE_ID} (node runtime): non-focusable role="presentation" object is excluded, even with an aria-label`, () => {
  const html = `<!doctype html><html><body><object id="o1" data="x.svg" role="presentation" aria-label="Decorative"></object></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): non-focusable role="none" object is excluded, same as role="presentation"`, () => {
  const html = `<!doctype html><html><body><object id="o2" data="x.svg" role="none" aria-label="Decorative"></object></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): a focusable role="presentation" object is NOT excluded (mirrors img-alt-present policy)`, () => {
  const html = `<!doctype html><html><body><object id="o3" data="x.svg" role="presentation" tabindex="0" aria-label="Focusable object"></object></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});
