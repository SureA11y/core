'use strict';

/**
 * A rule's outcome and its occurrences' tiers (occurrenceOutcome) agree, so
 * every reporter gives one answer: SARIF and JUnit read the tiers, EARL and
 * baselines the outcome. A custom rule returning them at odds was a failure
 * to some and not to others. The tiers decide; a manual rule still never
 * fails, and its fail-tier occurrences become cantTell with it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { buildBaselineEntries, matchBaseline } = require('../src/baseline.js');
const { renderEarlReport } = require('../src/earl.js');
const { renderHtmlReport } = require('../src/report.js');
const { framesOf } = require('../src/scan-result.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';

function scan(outcome, tier, type = 'automatic') {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return runa11yCoreOnHtml(HTML, {
      runOnly: ['org-x'],
      engineOptions: {
        customRules: [
          {
            id: 'org-x',
            meta: { title: 'X', type },
            // A function, not source built from the values: the scan runs in
            // Node, where the function itself is called.
            runInPage: (ctx) => ({
              outcome,
              occurrences: [
                {
                  __node: ctx.document.querySelector('p'),
                  ...(tier ? { occurrenceOutcome: tier } : {})
                }
              ]
            })
          }
        ]
      },
      entryPointParity: false
    });
  } finally {
    console.warn = warn;
  }
}

// Whether each reporter counts a failure.
function verdicts(result) {
  const sarif = JSON.parse(renderSarifReport(result));
  const junit = renderJunitReport(result);
  const earl = JSON.stringify(renderEarlReport(result));
  return {
    // The outcome as the reporters read it.
    outcome: framesOf(result, 'test')[0].result.checksResults[0].outcome,
    sarif: sarif.runs[0].results.some((r) => r.level === 'error'),
    junit: /failures="[1-9]/.test(junit),
    baseline: buildBaselineEntries(result).length > 0,
    earl: /earl:failed/.test(earl)
  };
}

test('every reporter gives the answer the occurrence tiers give', () => {
  const failing = { outcome: 'fail', sarif: true, junit: true, baseline: true, earl: true };
  const notFailing = (outcome) => ({
    outcome,
    sarif: false,
    junit: false,
    baseline: false,
    earl: false
  });
  for (const [outcome, tier, expected] of [
    ['cantTell', 'fail', failing],
    ['pass', 'fail', failing],
    ['fail', 'cantTell', notFailing('cantTell')],
    ['fail', null, failing],
    ['cantTell', null, notFailing('cantTell')]
  ]) {
    assert.deepEqual(
      verdicts(scan(outcome, tier)),
      expected,
      `${outcome} with a ${tier} occurrence`
    );
  }
});

test("a manual rule never fails, and its fail-tier occurrences don't either", () => {
  for (const outcome of ['fail', 'cantTell']) {
    const result = scan(outcome, 'fail', 'manual');
    assert.deepEqual(verdicts(result), {
      outcome: 'cantTell',
      sarif: false,
      junit: false,
      baseline: false,
      earl: false
    });
    assert.equal(result.checksResults[0].occurrences[0].occurrenceOutcome, 'cantTell');
  }
});

// A result stored before the engine made the two agree still has them at
// odds (#226). The reporters read it by the engine's rule, in one place, so
// they give one answer and a baseline built from it suppresses it.
function stored(outcome, tier, changes = {}) {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>',
    { runOnly: { includeRuleIds: ['img-alt-present'] }, entryPointParity: false }
  );
  const check = result.checksResults[0];
  assert.equal(check.outcome, 'fail');
  check.outcome = outcome;
  check.outcomeNormalized = outcome;
  Object.assign(check, changes);
  check.occurrences[0].occurrenceOutcome = tier;
  // Its rollup was rolled up from the outcome at odds.
  const rollup = result.rulesResults.find((r) => r.data.details.checksIds.includes(check.ruleId));
  rollup.outcome = outcome;
  rollup.data.details.contributors.find((c) => c.testId === check.ruleId).outcome = outcome;
  return { result, rollup: rollup.ruleId };
}

function storedVerdicts({ result, rollup }) {
  const html = renderHtmlReport(result);
  const entries = buildBaselineEntries(result);
  const rollupRow = html.match(
    new RegExp(`<tr>\\s*<td class="sc-cell">WCAG 1\\.1\\.1[\\s\\S]*?</tr>`)
  )[0];
  return {
    ...verdicts(result),
    html: /failure needs attention/.test(html),
    rollupFails: />Fail<\/span>/.test(rollupRow),
    rollupOutcome: framesOf(result, 'test')[0].result.rulesResults.find((r) => r.ruleId === rollup)
      .outcome,
    // The baseline built from it suppresses it everywhere.
    suppressed:
      entries.length > 0 &&
      matchBaseline(result, entries).newCount === 0 &&
      !JSON.parse(renderSarifReport(result, { baselineEntries: entries })).runs[0].results.some(
        (r) => r.level === 'error' && !r.baselineState
      ) &&
      /failures="0"/.test(renderJunitReport(result, { baselineEntries: entries }))
  };
}

test('a stored result with the outcome and tiers at odds reads by the tiers in every reporter', () => {
  const failing = {
    outcome: 'fail',
    sarif: true,
    junit: true,
    baseline: true,
    earl: true,
    html: true,
    rollupFails: true,
    rollupOutcome: 'fail',
    suppressed: true
  };
  assert.deepEqual(storedVerdicts(stored('cantTell', 'fail')), failing);
  assert.deepEqual(storedVerdicts(stored('pass', 'fail')), failing);
  assert.deepEqual(storedVerdicts(stored('fail', 'cantTell')), {
    outcome: 'cantTell',
    sarif: false,
    junit: false,
    baseline: false,
    earl: false,
    html: false,
    rollupFails: false,
    rollupOutcome: 'cantTell',
    suppressed: false
  });
});

test("a stored result keeps cantTell where the policy or a manual rule doesn't allow fail", () => {
  const notFailing = {
    outcome: 'cantTell',
    sarif: false,
    junit: false,
    baseline: false,
    earl: false
  };
  for (const [label, changes] of [
    ['policyOutcome fail', { policyOutcome: 'fail' }],
    [
      'a policy without fail',
      { engineOptions: { policy: { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] } } }
    ],
    [
      'a contract without fail',
      {
        engineOptions: {
          policyContract: { id: 'review', allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] }
        }
      }
    ],
    ['a manual rule', { type: 'manual' }]
  ]) {
    for (const outcome of ['cantTell', 'fail']) {
      const { result } = stored(outcome, 'fail', changes);
      assert.deepEqual(verdicts(result), notFailing, `${outcome}, ${label}`);
    }
  }
  // Under a policy without fail, the fail it found is kept as the engine keeps it.
  const { result } = stored('cantTell', 'fail', {
    engineOptions: { policy: { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] } }
  });
  const [frame] = framesOf(result, 'test');
  assert.equal(frame.result.checksResults[0].policyOutcome, 'fail');
  assert.equal(frame.result.checksResults[0].occurrences[0].occurrenceOutcome, 'cantTell');
  // A manual rule under the generic contract may fail, as the engine lets it.
  const generic = stored('cantTell', 'fail', {
    type: 'manual',
    engineOptions: { policyContract: 'generic' }
  });
  assert.equal(verdicts(generic.result).outcome, 'fail');
  assert.equal(verdicts(generic.result).earl, true);
});
