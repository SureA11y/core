'use strict';

// A value a page's script puts on Object.prototype, a plain one as well as a
// read-only one, is read for every key a plain object lacks. The engine
// reads only what its own objects and the caller's options hold, so a scan
// gives the result it gives without it (round 12, A12-1, A12-2, A12-3).

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const main = require('../src/index.js');
const { createDom } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>t</h1>' +
  '<img src="a.png"><img src="b.png"><a href="/x"></a></main></body></html>';

// Each key the engine reads of a rule's result, an occurrence, the caller's
// options or a flag only it sets, with a value that changes a scan that
// reads it.
const POISON = {
  occurrenceOutcome: 'pass',
  outcome: 'pass',
  type: 'manual',
  profile: 'wcag20-a',
  severity: 'minor',
  lean: { toward: 'pass' },
  error: 'poisoned',
  applicable: false,
  __budgetSpent: true,
  __profileNotApplied: 'timeBudget',
  __rulesNotRun: ['img-alt-present'],
  timeBudgetMs: 1,
  excludeSelectors: ['main'],
  contextSelector: 'h1',
  maxOccurrencesPerRule: 1,
  output: { maxOccurrencesPerRule: 1 },
  notRun: [{ ruleId: 'img-alt-present', reason: 'timeBudget' }],
  locale: 'de',
  includeHiddenElements: true,
  strictOptions: true,
  optInRules: 'all',
  rules: { 'img-alt-present': { enabled: false } },
  runOnly: { type: 'rule', values: ['html-lang-present'] },
  tags: ['wcag2aaa'],
  policy: { allowedOutcomes: ['pass'] }
};

const summary = (result) => ({
  checks: result.checksResults.map((c) => [
    c.ruleId,
    c.outcome,
    c.severity,
    (c.occurrences || []).length,
    (c.occurrences || []).map((o) =>
      Object.prototype.hasOwnProperty.call(o, 'occurrenceOutcome') ? o.occurrenceOutcome : null
    ),
    Object.prototype.hasOwnProperty.call(c, 'error') ? c.error : null
  ]),
  ownKeys: Object.keys(result).sort(),
  engineKeys: Object.keys(result.engine).sort()
});

const scans = () => {
  createDom(PAGE);
  return {
    node: () => main.runDomRulesInPage('https://example.test/', null, {}, null),
    inPage: () => main.runa11yCoreInPage('https://example.test/', null, {}, null),
    profiles: () =>
      main.runa11yCoreInPage(
        'https://example.test/',
        null,
        { profile: ['wcag22-aa', 'wcag21-aa'] },
        null
      )
  };
};

function withPrototypeValue(key, descriptor, fn) {
  assert.ok(!Object.prototype.hasOwnProperty.call(Object.prototype, key), key);
  Object.defineProperty(Object.prototype, key, { configurable: true, ...descriptor });
  try {
    return fn();
  } finally {
    delete Object.prototype[key];
  }
}

test('a plain or read-only value on Object.prototype changes no scan (round 12, A12-1, A12-2, A12-3)', () => {
  const run = scans();
  const clean = {};
  for (const [name, scan] of Object.entries(run)) clean[name] = summary(scan());
  // The page has failures for the poisoned keys to hide.
  assert.ok(
    clean.inPage.checks.some(([id, outcome]) => id === 'img-alt-present' && outcome === 'fail')
  );
  for (const [key, value] of Object.entries(POISON)) {
    for (const [form, descriptor] of [
      ['plain', { value, writable: true, enumerable: true }],
      ['read-only', { value, writable: false, enumerable: false }]
    ]) {
      for (const [name, scan] of Object.entries(run)) {
        const got = withPrototypeValue(key, descriptor, () => {
          const result = scan();
          // Put back as it was.
          const d = Object.getOwnPropertyDescriptor(Object.prototype, key);
          assert.equal(d && d.value, value, `${key} ${form} ${name}: restored`);
          assert.equal(d.writable, descriptor.writable, `${key} ${form} ${name}: restored`);
          assert.equal(d.enumerable, descriptor.enumerable, `${key} ${form} ${name}: restored`);
          return summary(result);
        });
        assert.deepEqual(got, clean[name], `${key} (${form}) on Object.prototype, ${name} scan`);
      }
    }
  }
});

test('the outcome every reporter reads is the occurrence own, not one on Object.prototype (round 12, A12-1)', () => {
  const { occurrenceOutcome, reviewGroupOf, tierOf } = require('../src/occurrence-outcome.js');
  withPrototypeValue(
    'occurrenceOutcome',
    { value: 'pass', writable: true, enumerable: true },
    () => {
      assert.equal(occurrenceOutcome({ outcome: 'fail' }, {}), 'fail');
      assert.equal(reviewGroupOf({ outcome: 'fail' }, {}), 'fail');
    }
  );
  withPrototypeValue('outcome', { value: 'cantTell', writable: true }, () => {
    assert.equal(tierOf({}), undefined);
    assert.equal(occurrenceOutcome({}, {}), null);
  });
  withPrototypeValue('lean', { value: { toward: 'pass' }, writable: true }, () => {
    assert.equal(reviewGroupOf({ outcome: 'cantTell' }, {}), 'open');
  });
});

test('a value on Object.prototype that cannot be taken off or written stops the scan with PAGE_BUILTINS_BROKEN (round 12, A12-3)', () => {
  // Not configurable, so it is tried in a process of its own.
  const script = `
    Object.defineProperty(Object.prototype, 'type', { value: 'manual' });
    const main = require(${JSON.stringify(path.join(__dirname, '../src/index.js'))});
    try {
      main.runa11yCoreInPage('https://example.test/', null, {}, null);
      console.log('no error');
    } catch (err) {
      console.log(JSON.stringify({ code: err.code, broken: err.broken }));
    }
  `;
  const out = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.deepEqual(JSON.parse(out.stdout.trim().split('\n').pop()), {
    code: 'PAGE_BUILTINS_BROKEN',
    broken: ['Object.prototype.type']
  });
});
