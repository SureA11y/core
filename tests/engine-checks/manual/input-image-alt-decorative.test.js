'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'input-image-alt-decorative';

// The fixture never uses role="presentation"/"none", so
// isRolePresentationExcluded's focusable-vs-not-focusable branches never run
// through runa11yCoreOnHtml (toString-embedded, uncounted by Node's
// --experimental-test-coverage per tests/node-runtime-parity.test.js's header
// comment) nor through the fixture's single runDomRulesInPage pass -- same
// gap as svg-/object-text-alternative-quality's identical helper.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'input-image-alt-decorative-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expected = ['ii_d_01', 'ii_d_06'];
  const notExpected = ['ii_d_02', 'ii_d_03', 'ii_d_04', 'ii_d_05', 'ii_d_07'];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'input-image-alt-decorative-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    '<input type="image"> avec alt="" : \u00e0 v\u00e9rifier (revue manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <input type="image"> dont l\u2019attribut alt est vide afin de v\u00e9rifier manuellement (souvent inadapt\u00e9 pour un contr\u00f4le fonctionnel).'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'V\u00e9rifiez <input type="image"> avec alt="".');
  assert.strictEqual(
    occ.hint,
    'Ce contr\u00f4le est g\u00e9n\u00e9ralement fonctionnel. Confirmez qu\u2019un nom accessible \u00e9quivalent existe, sinon fournissez un texte alt pertinent.'
  );
});

test(`${RULE_ID} (node runtime): non-focusable (disabled) role="presentation" input is excluded, even with alt=""`, () => {
  // A plain <input type="image"> is natively focusable by default (unlike a
  // <div>/<svg>, which need an explicit tabindex) -- disabled is what makes
  // it genuinely non-focusable here, matching the fixture's own ii_d_06 case.
  const html = `<!doctype html><html><body><input id="i1" type="image" alt="" src="x.png" role="presentation" disabled></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): non-focusable (disabled) role="none" input is excluded, same as role="presentation"`, () => {
  const html = `<!doctype html><html><body><input id="i2" type="image" alt="" src="x.png" role="none" disabled></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): a role="presentation" input WITHOUT disabled is NOT excluded — natively focusable by default`, () => {
  const html = `<!doctype html><html><body><input id="i4" type="image" alt="" src="x.png" role="presentation"></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): a focusable role="presentation" input is NOT excluded (mirrors img-alt-present policy)`, () => {
  const html = `<!doctype html><html><body><input id="i3" type="image" alt="" src="x.png" role="presentation" tabindex="0"></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});
