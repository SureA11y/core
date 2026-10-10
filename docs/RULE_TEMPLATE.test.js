'use strict';

/*
 * Test template for a rule made from docs/RULE_TEMPLATE.js.
 *
 * Copy it to tests/engine-checks/automatic/<rule-id>.test.js (manual rules:
 * tests/engine-checks/manual/) and replace every <placeholder>. A pack's test
 * imports the same helpers from @surea11y/core/testing instead:
 *   const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');
 * and scans with { engineOptions: { packs: [pack] }, runOnly: { includeRuleIds: [RULE_ID] } }.
 *
 * - A manual rule never returns fail: drop that test and keep the cantTell one.
 * - Assert stable evidence (which elements, reason codes), not full HTML.
 * - Add the fixture-coverage test of RULE_AUTHORING.md section 11.3.
 */

const test = require('node:test');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { assertRule } = require('../../helpers/assertRule.js');

const RULE_ID = '<rule-id>';

test(`${RULE_ID}: no applicable elements => notApplicable`, () => {
  const html = `<!doctype html><html><body>
  <!-- TODO: page with no applicable targets -->
</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: passing case => pass`, () => {
  const html = `<!doctype html><html><body>
  <!-- TODO: minimal passing fixture -->
</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: failing case => fail with 1+ occurrences`, () => {
  const html = `<!doctype html><html><body>
  <!-- TODO: minimal failing fixture -->
</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

// Only if the rule can report cantTell (always for a manual rule).
/*
test(`${RULE_ID}: undecidable case => cantTell with 1+ occurrences`, () => {
  const html = `<!doctype html><html><body>
  <!-- TODO: fixture the rule cannot decide -->
</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
});
*/
