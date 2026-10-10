'use strict';

// A policy that doesn't allow an outcome makes it cantTell, keeping what the
// rule found in policyOutcome, with no error: the reporters show a result to
// review, not a rule that did not complete. Unknown values in the policy's
// lists are named.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="A cat"></main></body></html>';

function scan(engineOptions) {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = runa11yCoreOnHtml(PAGE, { runOnly: ['img-alt-present'], engineOptions });
    return { result, warnings };
  } finally {
    console.warn = warn;
  }
}

test('an outcome the policy does not allow is cantTell, with what the rule found', () => {
  const { result } = scan({ policy: { allowedOutcomes: ['fail', 'cantTell'] } });
  const check = result.checksResults[0];
  assert.equal(check.outcome, 'cantTell');
  assert.equal(check.policyOutcome, 'pass');
  assert.equal(check.error, undefined);
  assert.doesNotMatch(renderSarifReport(result), /did not complete/);
  assert.doesNotMatch(renderJunitReport(result), /<error/);
  // Allowed outcomes are unchanged, with no policyOutcome.
  const plain = scan({}).result.checksResults[0];
  assert.equal(plain.outcome, 'pass');
  assert.equal('policyOutcome' in plain, false);
});

test("unknown values in the policy's lists are named, and strict mode throws", () => {
  const { result, warnings } = scan({
    policy: { allowedOutcomes: ['passed', 'fail'], allowedConfidence: ['hi'] }
  });
  assert.ok(warnings.some((w) => /policy\.allowedOutcomes: "passed" left out/.test(w)));
  assert.ok(
    warnings.some((w) =>
      /policy\.allowedConfidence: "hi" left out.*contract's list applies/.test(w)
    )
  );
  // 'passed' left out: pass is not allowed, so it is asked about.
  assert.equal(result.checksResults[0].policyOutcome, 'pass');
  // An empty list is no list.
  assert.equal(scan({ policy: { allowedOutcomes: [] } }).result.checksResults[0].outcome, 'pass');
  assert.throws(() => scan({ strictOptions: true, policy: { allowedOutcomes: ['passed'] } }), {
    code: 'INVALID_ENGINE_OPTIONS'
  });
});
