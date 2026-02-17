'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = "a11ycore-area-alt-decorative";

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "area-alt-decorative-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const expected = [
  "area_d_01"
];
  const notExpected = [
  "area_d_02"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "area-alt-decorative-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, "<area> avec alt=\"\" : d\u00e9coratif \u00e0 confirmer (revue manuelle)");
  assert.strictEqual(rule.description, "Signale les \u00e9l\u00e9ments <area> dont l\u2019attribut alt est vide afin de confirmer qu\u2019ils sont d\u00e9coratifs ou non informatifs.");

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, "V\u00e9rifiez si <area> est d\u00e9coratif (alt=\"\").");
  assert.strictEqual(occ.hint, "Confirmez que la zone n\u2019a pas de fonction ni d\u2019information. Sinon, fournissez un texte alt pertinent.");
});
