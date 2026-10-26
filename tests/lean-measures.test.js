'use strict';

/**
 * How often each lean is right (docs/LEANS.md): scripts/measure-leans.js
 * counts the leans the ACT test cases show against their answers, and the
 * build embeds the counts, so each lean of a rule, code and direction that
 * was counted on at least minCases cases carries them as `measured`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { leansIn, tally } = require('../scripts/measure-leans.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const MEASURES_PATH = path.join(__dirname, '..', 'scripts', 'data', 'lean-measures.json');

const occ = (reasonCode, toward, extra = {}) => ({
  data: { details: { reasonCode } },
  ...(toward ? { lean: { toward, why: 'w' } } : {}),
  ...extra
});

test('leansIn: each rule, code and direction a case shows, once, of the rules mapped to it', () => {
  const result = {
    checksResults: [
      {
        ruleId: 'heading-order',
        outcome: 'cantTell',
        occurrences: [occ('SKIP', 'fail'), occ('SKIP', 'fail'), occ('SKIP', 'pass'), occ('OPEN')]
      },
      // A failure's lean, if any, is no lean; nor is a rule the case isn't about.
      {
        ruleId: 'tiered',
        outcome: 'fail',
        occurrences: [occ('X', 'fail', { occurrenceOutcome: 'fail' })]
      },
      { ruleId: 'other', outcome: 'cantTell', occurrences: [occ('Y', 'fail')] },
      {
        ruleId: 'tiered-asks',
        outcome: 'fail',
        occurrences: [occ(undefined, 'pass', { occurrenceOutcome: 'cantTell' })]
      }
    ]
  };
  assert.deepEqual(
    [...leansIn(result, ['heading-order', 'tiered', 'tiered-asks'])].map((k) => k.split('\u0000')),
    [
      ['heading-order', 'SKIP', 'fail'],
      ['heading-order', 'SKIP', 'pass'],
      ['tiered-asks', 'DEFAULT', 'pass']
    ]
  );
});

test('tally: agreed when the lean points the way the case answers, sorted for a stable file', () => {
  const key = (...parts) => parts.join('\u0000');
  const leans = tally([
    { answer: 'fail', keys: new Set([key('b', 'C', 'fail'), key('a', 'C', 'pass')]) },
    { answer: 'pass', keys: new Set([key('b', 'C', 'fail')]) },
    { answer: 'pass', keys: new Set([key('a', 'C', 'pass')]) },
    { answer: 'fail', keys: new Set() }
  ]);
  assert.deepEqual(leans, {
    a: { C: { pass: { agreed: 1, cases: 2 } } },
    b: { C: { fail: { agreed: 1, cases: 2 } } }
  });
  assert.deepEqual(Object.keys(leans), ['a', 'b']);
});

const measures = fs.existsSync(MEASURES_PATH)
  ? JSON.parse(fs.readFileSync(MEASURES_PATH, 'utf8'))
  : null;

test(
  'lean-measures.json holds counts a lean can carry',
  { skip: !measures && 'not measured yet' },
  () => {
    assert.equal(typeof measures.corpus, 'string');
    assert.equal(typeof measures.coreVersion, 'string');
    assert.ok(Number.isInteger(measures.minCases) && measures.minCases > 0);
    for (const [ruleId, byCode] of Object.entries(measures.leans)) {
      for (const [code, byToward] of Object.entries(byCode)) {
        for (const [toward, m] of Object.entries(byToward)) {
          const where = `${ruleId} ${code} ${toward}`;
          assert.ok(toward === 'pass' || toward === 'fail', where);
          assert.ok(Number.isInteger(m.cases) && m.cases > 0, where);
          assert.ok(Number.isInteger(m.agreed) && m.agreed >= 0 && m.agreed <= m.cases, where);
        }
      }
    }
  }
);

// A conflict between role="none" and a native button leans fail; whether the
// ACT corpus counted it, and on enough cases, is the measures file's to say.
const CONFLICT =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>a</h1><button role="none">Go</button></main></body></html>';

test('a lean carries the counts of its rule, code and direction from minCases cases, and one counted on fewer none', () => {
  for (const [html, ruleId] of [
    [CONFLICT, 'presentation-role-conflict'],
    [CONFLICT.replace('<h1>a</h1>', '<h1>a</h1><h3>b</h3>'), 'heading-order']
  ]) {
    const [check] = runa11yCoreOnHtml(html, { runOnly: [ruleId] }).checksResults;
    const { lean, data } = check.occurrences[0];
    assert.ok(lean, ruleId);
    const byCode =
      measures && measures.leans[ruleId] && measures.leans[ruleId][data.details.reasonCode];
    const m = byCode && byCode[lean.toward];
    if (m && m.cases >= measures.minCases) {
      assert.deepEqual(lean.measured, {
        ...m,
        corpus: measures.corpus,
        coreVersion: measures.coreVersion
      });
    } else {
      assert.equal(lean.measured, undefined, ruleId);
    }
  }
});
