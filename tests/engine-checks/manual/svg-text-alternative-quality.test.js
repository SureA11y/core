'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = "svg-text-alternative-quality";

// The fixture's scenarios never use role="presentation"/"none", so
// isRolePresentationExcluded's focusable-vs-not-focusable branches never run
// through runa11yCoreOnHtml (toString-embedded, uncounted by Node's
// --experimental-test-coverage per tests/node-runtime-parity.test.js's header
// comment) nor through the fixture's single runDomRulesInPage pass. Exercise
// them directly here.
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
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "svg-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });

  const expected = [
  "s_q_01",
  "s_q_02",
  "s_q_05",
  "s_q_06",
  "s_q_07",
  "s_q_10"
];
  const notExpected = [
  "s_q_03",
  "s_q_04",
  "s_q_08",
  "s_q_09",
  "s_q_11"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "svg-text-alternative-quality-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, "<svg> : alternative textuelle \u00e0 v\u00e9rifier (revue manuelle)");
  assert.strictEqual(rule.description, "Signale les graphiques <svg> pour lesquels une alternative textuelle a \u00e9t\u00e9 d\u00e9tect\u00e9e, afin de v\u00e9rifier manuellement sa pertinence.");

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, "V\u00e9rifiez l\u2019alternative textuelle de <svg> (exactitude et pertinence).");
  assert.strictEqual(occ.hint, "Confirmez que <title>/<desc> ou le nom ARIA transmet le sens/le but du graphique dans son contexte.");
});

test(`${RULE_ID} (node runtime): non-focusable role="presentation" svg is excluded, even with an aria-label`, () => {
  const html = `<!doctype html><html><body><svg id="s1" role="presentation" aria-label="Decorative"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): non-focusable role="none" svg is excluded, same as role="presentation"`, () => {
  const html = `<!doctype html><html><body><svg id="s2" role="none" aria-label="Decorative"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): a focusable role="presentation" svg is NOT excluded (mirrors img-alt-present policy)`, () => {
  const html = `<!doctype html><html><body><svg id="s3" role="presentation" tabindex="0" aria-label="Focusable graphic"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});
