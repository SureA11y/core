'use strict';

/**
 * ACME B6: ACME 2.0 waives WCAG 3.3.8. Stress point 8 of DESIGN.md and
 * finding F13: a profile can only add rules, so it cannot waive one.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>T</h1>' +
  '<label>Password <input type="password" onpaste="return false"></label></main></body></html>';
const RULE = 'password-paste-enabled';
const ROLLUP = 'wcag-3.3.8-accessible-authentication-minimum';

const scan = (engineOptions) => runa11yCoreOnHtml(PAGE, { engineOptions });
const ran = (result) => result.checksResults.some((r) => r.ruleId === RULE);
const rollup = (result) => result.rulesResults.find((r) => r.ruleId === ROLLUP);

test('F13, as it stands: ACME 2.0 cannot waive 3.3.8; its rule and rollup still run', () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.ok(ran(result));
  assert.ok(rollup(result));
});

test('F13, as it stands: excluding the rule by hand leaves the criterion undecided', () => {
  // The runner reads a rollup rule that did not run as "not tested", so the
  // waived criterion shows as cantTell rather than going away.
  const result = scan({ profile: 'acme-2.0', rules: { exclude: RULE } });
  assert.ok(!ran(result));
  assert.equal(rollup(result).outcome, 'cantTell');
});
