'use strict';

/**
 * The catalog functions and engineOptions.customRules (#141). They
 * ignored customRules, so a tool listing what a scan would run showed
 * another set of rules than the scan ran. They now list the rules a scan
 * with the same options has, checked by the scan's own function.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { getChecksCatalog, getCheckDefById, getChecksForRunOnly } = require('../src/index.js');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

const rule = (id, tags) => ({
  id,
  meta: { title: id, description: id, tags, wcagSc: [], type: 'automatic' },
  runInPage:
    "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'pass', occurrences: [] }; }"
});

const ENGINE_OPTIONS = {
  customRules: [
    rule('my-best-practice', ['best-practice']),
    rule('my-wcag', ['wcag2a', 'wcag111']),
    rule('img-alt-present', ['images']),
    { id: 'no-run-in-page' },
    rule('wcag-1.1.1-non-text-content', ['wcag2a'])
  ]
};

test('getChecksCatalog lists the valid custom rules, an override in its built-in place', () => {
  const base = getChecksCatalog();
  const withCustom = getChecksCatalog(ENGINE_OPTIONS);
  assert.equal(withCustom.length, base.length + 2);
  const ids = withCustom.map((r) => r.ruleId);
  assert.equal(ids.filter((id) => id === 'img-alt-present').length, 1);
  for (const id of ['my-best-practice', 'my-wcag']) assert.ok(ids.includes(id), id);
  for (const id of ['no-run-in-page', 'wcag-1.1.1-non-text-content'])
    assert.ok(!ids.includes(id), id);
  assert.deepEqual(withCustom.find((r) => r.ruleId === 'img-alt-present').tags, [
    'images',
    'a11ycore'
  ]);
});

test('getCheckDefById finds a custom rule, and the override rather than its built-in', () => {
  assert.equal(getCheckDefById('my-wcag'), null);
  assert.equal(getCheckDefById('my-wcag', ENGINE_OPTIONS).ruleId, 'my-wcag');
  assert.deepEqual(getCheckDefById('img-alt-present', ENGINE_OPTIONS).tags, ['images', 'a11ycore']);
  assert.notDeepEqual(getCheckDefById('img-alt-present').tags, ['images', 'a11ycore']);
  assert.equal(getCheckDefById('no-run-in-page', ENGINE_OPTIONS), null);
});

test('getChecksForRunOnly selects exactly what a scan with the same options runs', () => {
  const page =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
  const cases = [
    [null, {}],
    [['my-best-practice'], {}],
    [{ tags: ['wcag2a'] }, {}],
    [{ wcag: { version: '2.2', level: 'AA' } }, {}],
    [null, { profile: 'wcag22-aa' }],
    [{ bestPractices: true }, { profile: 'wcag22-aa' }],
    [{ excludeRuleIds: ['img-alt-present'] }, {}]
  ];
  const { warn, info } = console;
  console.warn = () => {};
  console.info = () => {};
  try {
    for (const [runOnly, extra] of cases) {
      const engineOptions = { ...ENGINE_OPTIONS, ...extra };
      const listed = getChecksForRunOnly(runOnly, engineOptions)
        .map((r) => r.ruleId)
        .sort();
      const ran = runa11yCoreOnHtml(page, { engineOptions, runOnly, entryPointParity: false })
        .checksResults.map((c) => c.ruleId)
        .sort();
      assert.deepEqual(listed, ran, JSON.stringify([runOnly, extra]));
    }
  } finally {
    console.warn = warn;
    console.info = info;
  }
});

test('without customRules the catalog is unchanged', () => {
  assert.deepEqual(getChecksCatalog({}), getChecksCatalog());
  assert.deepEqual(getChecksCatalog({ customRules: [] }), getChecksCatalog());
});
