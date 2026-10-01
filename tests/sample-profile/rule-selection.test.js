'use strict';

/**
 * Opt-in rules in rule selection: a rule carrying a standard's rule tag runs
 * only when an include names its tag or id, or engineOptions.optInRules
 * unlocks it; the rest of the selection then decides as for any rule. Run
 * against the engine copy with the sample profile (tests/helpers/sampleEngine.js),
 * whose own rules are tagged sample.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const core = requireSample('src/core.js');

const OPT_IN = ['sample-contrast-enhanced', 'sample-statement-link', 'sample-title-length'];
const PLAIN = 'img-alt-present';

const selected = (engineOptions, runOnly = null) =>
  core.getChecksForRunOnly(runOnly, engineOptions).map((r) => r.ruleId);
const optInOf = (ids) => ids.filter((id) => OPT_IN.includes(id)).sort();

test('the opt-in rules are the ones carrying the sample tag', () => {
  const tagged = core.CHECK_DEFS.filter((d) => (d.tags || []).includes('sample')).map(
    (d) => d.ruleId
  );
  assert.deepEqual(tagged.sort(), OPT_IN);
});

test('by default every check runs but the opt-in ones', () => {
  const got = selected(undefined);
  assert.deepEqual(optInOf(got), []);
  assert.equal(got.length, core.CHECK_DEFS.length - OPT_IN.length);
});

test('optInRules unlocks them by tag, case-insensitively, or all of them', () => {
  for (const optInRules of ['all', 'sample', 'SAMPLE', ['sample'], 'all, nope']) {
    const got = selected({ optInRules });
    assert.deepEqual(optInOf(got), OPT_IN, JSON.stringify(optInRules));
    assert.equal(got.length, core.CHECK_DEFS.length, JSON.stringify(optInRules));
  }
  for (const optInRules of ['nope', '', false, null]) {
    assert.deepEqual(optInOf(selected({ optInRules })), [], JSON.stringify(optInRules));
  }
});

test('an include naming their tag or id selects them without optInRules', () => {
  assert.deepEqual(optInOf(selected({ tags: { include: 'sample' } })), OPT_IN);
  assert.deepEqual(selected({ rules: { include: `sample-title-length, ${PLAIN}` } }).sort(), [
    PLAIN,
    'sample-title-length'
  ]);
});

test('optInRules only lifts the gate; the rest of the selection still decides', () => {
  const unlocked = (engineOptions, runOnly) =>
    selected({ ...engineOptions, optInRules: 'all' }, runOnly);
  assert.deepEqual(optInOf(unlocked({ tags: { exclude: 'sample' } })), []);
  assert.deepEqual(optInOf(unlocked({ tags: { include: 'wcag2a, wcag2aa' } })), []);
  assert.deepEqual(optInOf(unlocked({ tags: { include: 'color' } })), ['sample-contrast-enhanced']);
  assert.deepEqual(optInOf(unlocked({ rules: { exclude: 'sample-title-length' } })), [
    'sample-contrast-enhanced',
    'sample-statement-link'
  ]);
  assert.deepEqual(unlocked({}, { includeRuleIds: [PLAIN] }), [PLAIN]);
  assert.deepEqual(optInOf(unlocked({}, { excludeTags: ['sample'] })), []);
});
