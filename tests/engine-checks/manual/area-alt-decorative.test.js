'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = "area-alt-decorative";

// The fixture never uses role="presentation"/"none" on an <area>, nor a case
// where every <area> is filtered out after being in a used map (so
// applicableCount ends at 0 only after the loop, not via the early
// !els.length return) -- neither ran through runa11yCoreOnHtml (toString-
// embedded, uncounted by Node's --experimental-test-coverage per
// tests/node-runtime-parity.test.js's header comment) nor the fixture's
// single runDomRulesInPage pass.
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
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "area-alt-decorative-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expected = [
  "area_d_01",
  "area_d_06"
];
  const notExpected = [
  "area_d_02",
  "area_d_03",
  "area_d_04",
  "area_d_05",
  "area_d_07"
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

// Unlike svg-/object-text-alternative-quality and input-image-alt-decorative,
// this rule's isRolePresentationExcluded "not focusable -> excluded" branch
// is not reachable through any applicable <area>: applicability already
// requires the <area> to belong to a *used* image map (see the `if (!img)
// continue` gate above), and the engine's own isPlatformFocusable policy
// (dom-helpers.js) treats every <area> in a used map as natively focusable
// regardless of tabindex -- so role="presentation"/"none" alone never
// excludes an applicable <area> here. Both role values below correctly stay
// NOT excluded for that reason (documented, not a coverage gap to force).
test(`${RULE_ID} (node runtime): role="presentation" area in a used map is NOT excluded (used-map areas are always natively focusable)`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m"><area id="a1" alt="" role="presentation" shape="rect" coords="0,0,1,1"></map>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): role="none" area in a used map is NOT excluded, same as role="presentation"`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m"><area id="a2" alt="" role="none" shape="rect" coords="0,0,1,1"></map>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): a focusable (tabindex) role="presentation" area is NOT excluded (mirrors img-alt-present policy)`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m"><area id="a3" alt="" role="presentation" tabindex="0" shape="rect" coords="0,0,1,1"></map>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): notApplicable when <area> elements exist in a used map but every one is filtered out (applicableCount reaches 0 after the loop, not via the early no-elements return)`, () => {
  const html = `<!doctype html><html><body>
    <img alt="" usemap="#m" src="x.png">
    <map name="m"><area id="a4" alt="Non-empty" shape="rect" coords="0,0,1,1"></map>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});
