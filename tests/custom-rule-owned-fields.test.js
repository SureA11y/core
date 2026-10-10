'use strict';

/**
 * What a custom or pack rule returns is checked where the engine owns the
 * answer. An occurrence is an object: null, a string, a number or an array
 * in the list named no element and was counted as a finding. policyOutcome
 * and ruleSeverity say what the policy and a profile made of a result, and a
 * rule returning them could pass for either. Each is left out and noted in
 * `error`; a fail left with no occurrence is reported on the document
 * element, as any fail that names nothing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('../src/testing.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>';

const rule = (id, body) => ({
  id,
  meta: { title: id, description: id },
  runInPage: `function (ctx) { ${body} }`
});

function scan(customRule) {
  const { warn } = console;
  console.warn = () => {};
  try {
    const r = runa11yCoreOnHtml(HTML, {
      engineOptions: { customRules: [customRule] },
      runOnly: [customRule.id]
    });
    return r.checksResults.find((c) => c.ruleId === customRule.id);
  } finally {
    console.warn = warn;
  }
}

test('occurrences that are not objects are left out, and noted', () => {
  const c = scan(
    rule(
      'acme-occ',
      "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [null, 'text', 5, [1], { __node: ctx.document.querySelector('p'), summary: 'ok' }] };"
    )
  );
  assert.equal(c.outcome, 'fail');
  assert.deepEqual(
    c.occurrences.map((o) => o.summary),
    ['ok']
  );
  assert.match(c.error, /4 occurrences that are not an object; left out/);
});

test('a fail whose occurrences are all left out is reported on the document element', () => {
  const c = scan(
    rule('acme-none', "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [null] };")
  );
  assert.equal(c.outcome, 'fail');
  assert.equal(c.occurrences.length, 1);
  assert.equal(c.occurrences[0].data.details.reasonCode, 'FAIL_WITHOUT_OCCURRENCE');
  assert.match(c.error, /1 occurrence that is not an object/);
});

test('policyOutcome and ruleSeverity in a rule’s return are not taken', () => {
  const c = scan(
    rule(
      'acme-owned',
      "return { ruleId: ctx.rule.ruleId, outcome: 'pass', policyOutcome: 'fail', ruleSeverity: 'critical', occurrences: [] };"
    )
  );
  assert.equal(c.outcome, 'pass');
  assert.equal('policyOutcome' in c, false);
  assert.equal('ruleSeverity' in c, false);
  assert.match(c.error, /policyOutcome and ruleSeverity, which the engine sets; not taken/);
});

test('a well-formed result is unchanged', () => {
  const c = scan(
    rule(
      'acme-ok',
      "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('p'), summary: 'ok' }] };"
    )
  );
  assert.equal(c.outcome, 'fail');
  assert.equal(c.occurrences.length, 1);
  assert.equal(c.error, undefined);
});
