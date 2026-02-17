'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = "a11ycore-object-text-alternative-quality";

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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });

  const expected = [
  "o_q_01",
  "o_q_02",
  "o_q_04"
];
  const notExpected = [
  "o_q_03",
  "o_q_05"
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
