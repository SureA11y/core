'use strict';

/**
 * ctx.standard: the standard and version a run's profile targets, which a
 * rule whose behaviour differs between versions reads. Null when no
 * standard's profile selected the run. Checked through a custom rule, in both
 * entry points.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runDomRulesInPage, runa11yCoreInPage } = require('../src/index.js');

// A custom rule that reports what it saw as its outcome: it passes when
// ctx.standard is what the test expects. A function-source string, so the
// in-page runner can take it too.
function probe(tags, expected) {
  return {
    id: 'probe-standard',
    meta: { title: 'probe', tags, wcagSc: ['1.1.1'], type: 'automatic' },
    runInPage: `function runInPage(ctx) {
      const seen = ctx.standard ? JSON.stringify(ctx.standard) : 'null';
      return { outcome: seen === ${JSON.stringify(expected)} ? 'pass' : 'fail', occurrences: [] };
    }`
  };
}

function outcomes(engineOptions, rule) {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><p>x</p></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const options = { ...engineOptions, customRules: [rule] };
    return [runDomRulesInPage, runa11yCoreInPage].map((run) => {
      const r = run('https://example.test/', null, options).checksResults.find(
        (c) => c.ruleId === 'probe-standard'
      );
      return r ? r.outcome : 'not run';
    });
  } finally {
    dom.window.close();
  }
}

test("a standard's profile gives every rule its standard and version", () => {
  const cases = [
    [
      { profile: 'en301549-v4.1.1' },
      ['wcag2a', 'wcag111'],
      { key: 'en301549', name: 'EN 301 549', version: 'V4.1.1' }
    ]
  ];
  for (const [engineOptions, tags, standard] of cases) {
    assert.deepEqual(
      outcomes(engineOptions, probe(tags, JSON.stringify(standard))),
      ['pass', 'pass'],
      JSON.stringify(engineOptions)
    );
  }
});

test('no profile, a WCAG profile, or rules chosen by tag give null', () => {
  const cases = [
    [{}, ['wcag2a', 'wcag111']],
    [{ profile: 'wcag22-aa' }, ['wcag2a', 'wcag111']]
  ];
  for (const [engineOptions, tags] of cases) {
    assert.deepEqual(
      outcomes(engineOptions, probe(tags, 'null')),
      ['pass', 'pass'],
      JSON.stringify(engineOptions)
    );
  }
});
