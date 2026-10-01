'use strict';

/**
 * ACME B6: ACME 2.0 waives WCAG 3.3.8 (`exclude: { criteria: ['3.3.8'] }` on
 * acme-2.0). Stress point 8 of DESIGN.md, finding F13.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../../src/index.js');
const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>T</h1>' +
  '<label>Password <input type="password" onpaste="return false"></label></main></body></html>';
const RULE = 'password-paste-enabled';
const ROLLUP = 'wcag-3.3.8-accessible-authentication-minimum';

const scan = (engineOptions) => runa11yCoreOnHtml(PAGE, { engineOptions });
const ran = (result) => result.checksResults.some((r) => r.ruleId === RULE);
const rolled = (result) => result.rulesResults.some((r) => r.ruleId === ROLLUP);

test('under acme-2.0, the waived criterion runs neither its rule nor its rollup', () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.ok(!ran(result));
  assert.ok(!rolled(result));
  assert.deepEqual(result.engine.profileExcludes, { rules: [], criteria: ['3.3.8'] });
});

test('the catalog leaves them out too', () => {
  const options = { profile: 'acme-2.0' };
  assert.ok(!core.getChecksForRunOnly(null, options).some((r) => r.ruleId === RULE));
  assert.ok(!core.getRulesCatalog(options).some((r) => r.id === ROLLUP));
});

test('a WCAG 2.2 run still checks 3.3.8, and says nothing was excluded', () => {
  const result = scan({ profile: 'wcag22-aa' });
  assert.ok(ran(result));
  assert.ok(rolled(result));
  assert.equal(result.engine.profileExcludes, undefined);
});
