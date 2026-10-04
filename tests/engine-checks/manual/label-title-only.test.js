'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../../../src/index.js');

// Deprecated since 1.10.0: every finding it made duplicated one the
// successor makes for the same element, so it stays in the catalog but
// decides nothing.
const RULE_ID = 'label-title-only';
const SUCCESSOR = 'form-control-programmatic-label-quality';

function run(body, runOnly = [RULE_ID]) {
  return runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, { runOnly });
}

test(`${RULE_ID}: is in the catalog, deprecated in favour of ${SUCCESSOR}`, () => {
  const catalog = getChecksCatalog();
  const entry = catalog.find((r) => r.ruleId === RULE_ID);
  assert.ok(entry, 'the rule id stays published until the file is removed in 2.0.0');
  assert.strictEqual(entry.deprecated, true);
  assert.strictEqual(entry.deprecation.replacedBy, SUCCESSOR);
  assert.strictEqual(entry.deprecation.sinceVersion, '1.10.0');
  assert.ok(entry.deprecation.reason, 'the catalog says why');
  assert.ok(
    catalog.some((r) => r.ruleId === SUCCESSOR && !r.deprecated),
    'the successor is a live rule'
  );
});

// Each case it used to report, including the two where a <label> exists but
// names nothing, is notApplicable here and reported once by the successor.
for (const [label, body] of [
  ['the title is the only label', '<input id="a" title="Phone">'],
  ['an empty label[for] names nothing', '<label for="a"></label><input id="a" title="Phone">'],
  ['an empty wrapping <label> names nothing', '<label><input id="a" title="Phone"></label>'],
  ['a <select> has only a title', '<select id="a" title="Country"><option>Spain</option></select>']
]) {
  test(`${RULE_ID}: notApplicable, and the successor reports it once, when ${label}`, () => {
    assertRule(run(body), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
    const both = run(body, [RULE_ID, SUCCESSOR]);
    const rule = assertRule(both, SUCCESSOR, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'label_from_title_primary');
  });
}
