'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = "a11ycore-canvas-text-alternative-quality";

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "canvas-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expected = [
  "c_q_01",
  "c_q_02",
  "c_q_05",
  "c_q_08"
];
  const notExpected = [
  "c_q_03",
  "c_q_04",
  "c_q_06",
  "c_q_07",
  "c_q_09"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "canvas-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, "<canvas> : alternative textuelle \u00e0 v\u00e9rifier (revue manuelle)");
  assert.strictEqual(rule.description, "Signale les \u00e9l\u00e9ments <canvas> pour lesquels une alternative textuelle a \u00e9t\u00e9 d\u00e9tect\u00e9e, afin de v\u00e9rifier manuellement son \u00e9quivalence.");

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, "V\u00e9rifiez l\u2019alternative textuelle de <canvas> (\u00e9quivalence et pertinence).");
  assert.strictEqual(occ.hint, "Confirmez que le texte de secours ou le nom accessible transmet la m\u00eame information/fonction que le contenu du canvas.");
});
