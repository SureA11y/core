'use strict';

/**
 * Custom rules and the run's selection (#138). Under a profile, a WCAG
 * target or a tag selection, a custom rule the selection left out was
 * dropped without a trace, and an override without its built-in's tags
 * removed the built-in from the run.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

const rule = (id, tags, outcome = 'pass') => ({
  id,
  meta: { title: id, description: id, tags, wcagSc: [], type: 'automatic' },
  runInPage: `function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: '${outcome}', occurrences: [] }; }`
});

const CUSTOM = [
  rule('my-best-practice', ['best-practice']),
  rule('my-wcag', ['wcag2a', 'wcag111']),
  rule('img-alt-present', ['images'], 'cantTell')
];

function scan(engineOptions, runOnly) {
  const { warn } = console;
  const warned = [];
  console.warn = (m) => warned.push(String(m));
  try {
    const result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { ...engineOptions, customRules: CUSTOM },
      runOnly,
      entryPointParity: false
    });
    const ran = new Set(result.checksResults.map((c) => c.ruleId));
    return { result, ran, warned };
  } finally {
    console.warn = warn;
  }
}

const SELECTIONS = [
  ['a profile', { profile: 'wcag22-aa' }, null],
  ['a WCAG target', {}, { wcag: { version: '2.2', level: 'AA' } }],
  ['tags', {}, { tags: ['wcag2a'] }]
];

for (const [name, engineOptions, runOnly] of SELECTIONS) {
  test(`under ${name}, an override runs in its built-in's place`, () => {
    const { result, ran } = scan(engineOptions, runOnly);
    assert.ok(ran.has('img-alt-present'));
    const check = result.checksResults.find((c) => c.ruleId === 'img-alt-present');
    assert.equal(check.outcome, 'cantTell', 'the override ran, not the built-in');
    assert.ok(ran.has('my-wcag'));
  });

  test(`under ${name}, a custom rule left out is listed and said`, () => {
    const { result, ran, warned } = scan(engineOptions, runOnly);
    assert.ok(!ran.has('my-best-practice'));
    assert.deepEqual(
      result.skippedCustomRules.map((s) => s.id),
      ['my-best-practice']
    );
    assert.match(result.skippedCustomRules[0].reason, /^not selected by the run's /);
    assert.equal(warned.filter((w) => /customRules: not run/.test(w)).length, 1);
  });
}

test('under a profile, the reason names the profile and a way in that keeps it', () => {
  const { result } = scan({ profile: 'wcag22-aa' }, null);
  assert.equal(
    result.skippedCustomRules[0].reason,
    "not selected by the run's profile \"wcag22-aa\"; to run it, tag it with the WCAG criteria it checks (as 'wcag111'), or add runOnly.bestPractices for a best-practice rule."
  );
  const withBestPractices = scan({ profile: 'wcag22-aa' }, { bestPractices: true });
  assert.ok(withBestPractices.ran.has('my-best-practice'));
  assert.equal(withBestPractices.result.engine.profile, 'wcag22-aa');
  assert.deepEqual(withBestPractices.result.skippedCustomRules, []);
});

test('with no selection every custom rule runs and none is listed', () => {
  const { result, ran } = scan({}, null);
  for (const r of CUSTOM) assert.ok(ran.has(r.id), r.id);
  assert.deepEqual(result.skippedCustomRules, []);
});

test('an override excluded by id stays out, with its built-in', () => {
  const { ran, result } = scan({}, { excludeRuleIds: ['img-alt-present'] });
  assert.ok(!ran.has('img-alt-present'));
  assert.deepEqual(
    result.skippedCustomRules.map((s) => s.id),
    ['img-alt-present']
  );
});
