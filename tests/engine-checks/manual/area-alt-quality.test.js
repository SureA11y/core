'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = "a11ycore-area-alt-quality";

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "area-alt-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expected = [
  "area_q_01",
  "area_q_06"
];
  const notExpected = [
  "area_q_02",
  "area_q_03",
  "area_q_04",
  "area_q_05",
  "area_q_07"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "area-alt-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, "<area> : texte alt \u00e0 v\u00e9rifier (revue manuelle)");
  assert.strictEqual(rule.description, "Signale les \u00e9l\u00e9ments <area> dont l\u2019attribut alt n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence.");

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, "V\u00e9rifiez le texte alt de <area> (exactitude et pertinence).");
  assert.strictEqual(occ.hint, "Assurez-vous que le texte alt identifie la destination/l\u2019action de la zone dans son contexte.");
});
