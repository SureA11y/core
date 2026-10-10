'use strict';

/**
 * A rule selection whose includes and excludes cancel each other ran no
 * rule, and its result read as a clean pass (JUnit tests="0", SARIF with no
 * result), with no word even under strictOptions. It now warns, and throws
 * INVALID_RUN_ONLY under strictOptions, as an include naming nothing does.
 * An includeMode other than "and" or "or" was read as "and" silently.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';

function scan(runOnly, engineOptions = {}) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = runa11yCoreOnHtml(HTML, { runOnly, engineOptions, entryPointParity: false });
    return { result, warnings };
  } finally {
    console.warn = warn;
  }
}

const CANCELLING = [
  [
    'a rule both included and excluded',
    { includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] }
  ],
  ['a tag both included and excluded', { tags: ['wcag2a'], excludeTags: ['wcag2a'] }],
  ['rules and tags with no rule in common', { includeRuleIds: ['region'], tags: ['wcag111'] }]
];

test('a selection that runs no rule warns, and throws under strictOptions', () => {
  for (const [name, runOnly] of CANCELLING) {
    const { result, warnings } = scan(runOnly);
    assert.equal(result.checksResults.length, 0, name);
    assert.ok(
      warnings.some((w) => /The rule selection runs no rule .*reads as a clean pass/.test(w)),
      name
    );
    assert.throws(
      () => scan(runOnly, { strictOptions: true }),
      (e) => e.code === 'INVALID_RUN_ONLY' && /runs no rule/.test(e.message),
      name
    );
  }
});

test('an includeMode other than "and" or "or" warns, and throws under strictOptions', () => {
  const runOnly = { tags: ['wcag2a'], includeMode: 'xor' };
  const { result, warnings } = scan(runOnly);
  assert.ok(result.checksResults.length > 0);
  assert.ok(warnings.some((w) => /runOnly\.includeMode must be "and" or "or", not "xor"/.test(w)));
  assert.throws(
    () => scan(runOnly, { strictOptions: true }),
    (e) => e.code === 'INVALID_RUN_ONLY' && /includeMode/.test(e.message)
  );
  assert.deepEqual(scan({ tags: ['wcag2a'], includeMode: 'OR' }).warnings, []);
});

test('a selection that runs rules says nothing', () => {
  const { result, warnings } = scan({ tags: ['wcag2a'] });
  assert.ok(result.checksResults.length > 0);
  assert.deepEqual(warnings, []);
});
