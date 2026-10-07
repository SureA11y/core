'use strict';

// What the engine takes from a rule's return, and what stays its own.

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';

function runCustom(type, returned) {
  const rule = {
    id: 'acme-x',
    meta: { title: 'X', type, tags: ['best-practice'] },
    runInPage: () => returned
  };
  return runa11yCoreOnHtml(PAGE, {
    runOnly: ['acme-x'],
    engineOptions: { customRules: [rule] }
  }).checksResults.find((r) => r.ruleId === 'acme-x');
}

// A rule's type is its meta's (#159): a different one in its return
// changes neither the coercion nor the result, and is noted in error.
test('a returned type does not change the rule type', () => {
  const automatic = runCustom('automatic', { outcome: 'fail', type: 'manual', occurrences: [] });
  assert.strictEqual(automatic.type, 'automatic');
  assert.strictEqual(automatic.outcome, 'fail');
  assert.match(automatic.error, /returned type "manual"; a rule's type comes from its meta/);

  const manual = runCustom('manual', { outcome: 'fail', type: 'automatic', occurrences: [] });
  assert.strictEqual(manual.type, 'manual');
  assert.strictEqual(manual.outcome, 'cantTell');
  assert.match(manual.error, /returned type "automatic"/);

  const same = runCustom('automatic', { outcome: 'pass', type: 'automatic', occurrences: [] });
  assert.strictEqual(same.error, undefined);
});
