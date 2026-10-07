'use strict';

// Selection forms that used to run every rule, or none, without a word.

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

function run(runOnly, engineOptions) {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = runa11yCoreOnHtml(PAGE, { runOnly, engineOptions });
    const ids = result.checksResults.map((c) => c.ruleId);
    return { count: ids.length, ids, result, warnings };
  } finally {
    console.warn = warn;
  }
}

test('{ type, values } reads values given as a string, and keeps the keys beside it', () => {
  assert.throws(() => run({ type: 'tag', values: 'wcag2aaaa' }), {
    code: 'INVALID_RUN_ONLY',
    message: 'runOnly.tags: no tag named "wcag2aaaa".'
  });
  assert.strictEqual(run({ type: 'tag', values: 'wcag2a' }).count, run(['wcag2a']).count);
  const excluded = run({ type: 'tag', values: ['wcag2a'], excludeTags: ['images'] });
  assert.ok(!excluded.ids.includes('img-alt-present'));
  assert.ok(excluded.count < run(['wcag2a']).count);
});

test('a Set, and engineOptions.rules / .tags / .tests given as lists, select what they name', () => {
  assert.deepStrictEqual(run(new Set(['img-alt-present'])).ids, ['img-alt-present']);
  assert.deepStrictEqual(run(null, { rules: ['img-alt-present'] }).ids, ['img-alt-present']);
  assert.strictEqual(run(null, { tags: ['wcag2a'] }).count, run(['wcag2a']).count);
  assert.strictEqual(run(null, { tags: 'wcag2a' }).count, run(['wcag2a']).count);
});

test('an unknown key beside known ones is warned about', () => {
  const r = run({ tags: ['wcag2a'], includeRuleId: ['x'] });
  assert.strictEqual(r.count, run(['wcag2a']).count);
  assert.ok(r.warnings.some((w) => w.includes('runOnly: no key named "includeRuleId"; ignored.')));
});

test('a composite id with the legacy prefix excludes its rules too', () => {
  for (const id of ['wcag-1.1.1-non-text-content', 'a11ycore-wcag-1.1.1-non-text-content']) {
    const r = run({ tags: ['wcag2a'], excludeRuleIds: [id] });
    assert.ok(!r.ids.includes('img-alt-present'), id);
    assert.strictEqual(r.warnings.length, 0, id);
  }
});

test('test id lists are checked like rule id lists', () => {
  assert.throws(() => run({ includeTestIds: ['img-alt-presnt'] }), {
    code: 'INVALID_RUN_ONLY',
    message: 'runOnly.includeTestIds: no rule named "img-alt-presnt".'
  });
  assert.throws(() => run(null, { tests: { include: ['img-alt-presnt'] } }), {
    code: 'INVALID_RUN_ONLY'
  });
  assert.deepStrictEqual(run({ includeTestIds: ['img-alt-present'] }).ids, ['img-alt-present']);
});
