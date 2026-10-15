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

test('a policy without fail keeps a rule with fail-tier occurrences cantTell, tiers included', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<img src="a.png"><div role="caption" aria-label="Shipping">Free</div></main></body></html>';
  const tiered = {
    id: 'acme-tiered',
    meta: { title: 'Tiered', wcagSc: ['1.1.1'] },
    runInPage: (ctx) => ({
      outcome: 'cantTell',
      occurrences: [
        { __node: ctx.document.querySelector('img'), summary: 'bad', occurrenceOutcome: 'fail' }
      ]
    })
  };
  const policy = { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] };
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['acme-tiered', 'aria-prohibited-attr'],
    engineOptions: { policy, customRules: [tiered] },
    entryPointParity: false
  });
  for (const ruleId of ['acme-tiered', 'aria-prohibited-attr']) {
    const check = result.checksResults.find((c) => c.ruleId === ruleId);
    assert.equal(check.outcome, 'cantTell', ruleId);
    assert.equal(check.policyOutcome, 'fail', ruleId);
    assert.ok(check.occurrences.length > 0, ruleId);
    assert.ok(
      check.occurrences.every((o) => o.occurrenceOutcome !== 'fail'),
      `${ruleId}: ${JSON.stringify(check.occurrences.map((o) => o.occurrenceOutcome))}`
    );
  }
  const sarifLevels = JSON.parse(renderSarifReport(result)).runs[0].results.map((r) => r.level);
  assert.ok(!sarifLevels.includes('error'), JSON.stringify(sarifLevels));
  assert.match(renderJunitReport(result), /failures="0"/);
  // Without the policy the same rules fail, tiers and all.
  const plain = runa11yCoreOnHtml(html, {
    runOnly: ['acme-tiered', 'aria-prohibited-attr'],
    engineOptions: { customRules: [tiered] },
    entryPointParity: false
  });
  for (const check of plain.checksResults) assert.equal(check.outcome, 'fail', check.ruleId);
});
