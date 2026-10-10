'use strict';

// A list option holding a value that can't be turned into text (an object
// without a prototype) is read without it, instead of the scan failing with
// an uncoded TypeError. Under strictOptions, the options are checked before
// the rule selection is worked out from them, so a wrong one is named with
// INVALID_ENGINE_OPTIONS.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';
const bare = () => Object.create(null);

function scan(engineOptions, runOnly) {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return runa11yCoreOnHtml(PAGE, { engineOptions, runOnly });
  } finally {
    console.warn = warn;
  }
}

test('a value without a prototype in a list option is left out', () => {
  const plain = scan({});
  for (const [label, engineOptions, runOnly] of [
    ['optInRules', { optInRules: bare() }],
    ['mappings', { mappings: [bare()] }],
    ['excludeSelectors', { excludeSelectors: [bare()] }],
    ['runOnly.tags', {}, { tags: [bare(), 'wcag2a'] }]
  ]) {
    const result = scan(engineOptions, runOnly);
    assert.ok(result.checksResults.length > 0, label);
  }
  assert.deepEqual(
    scan({ mappings: [bare(), 'en301549'] }).engine.mappings,
    scan({ mappings: ['en301549'] }).engine.mappings
  );
  assert.ok(plain.checksResults.length > 0);
});

test('strictOptions names a wrong option before working out the selection', () => {
  for (const engineOptions of [{ optInRules: bare() }, { mappings: [bare()] }, { rules: [{}] }]) {
    assert.throws(() => scan({ strictOptions: true, ...engineOptions }), {
      code: 'INVALID_ENGINE_OPTIONS'
    });
  }
});
