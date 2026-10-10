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
const { buildBaselineEntries } = require('../src/baseline.js');
const { renderEarlReport } = require('../src/earl.js');

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
    outcome: result.checksResults[0].outcome,
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
