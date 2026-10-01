'use strict';

/**
 * ACME's entry: registered, its profile selects rules, and its tables are
 * sound against the rules that exist.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../../src/index.js');
const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');
const { standard } = require('../index.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>Page</title></head>' +
  '<body><main><h1>Title</h1><img src="a.png"></main></body></html>';

test('its profile is known and selects rules', () => {
  const result = runa11yCoreOnHtml(PAGE, { engineOptions: { profile: 'acme-1.0' } });
  assert.equal(result.engine.profile, 'acme-1.0');
  assert.ok(result.checksResults.length > 0);
});

test('its tables are sound against the rules that exist', () => {
  const rules = core.getChecksCatalog().map((r) => ({ ruleId: r.ruleId, wcagSc: r.wcagSc || [] }));
  assert.deepEqual(standard.validate(rules), []);
});

test('no default or WCAG run produces its rollups', () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions });
    assert.deepEqual(
      result.rulesResults.filter((r) => r.meta && r.meta.standard === standard.standard),
      []
    );
  }
});
