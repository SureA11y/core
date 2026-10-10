'use strict';

// A page whose scripts break a JavaScript built-in the engine relies on
// stops the scan with PAGE_BUILTINS_BROKEN, naming it, instead of a result
// that reads well and is wrong (an empty one when Array.prototype.filter
// returns its input). A page that adds then to Object.prototype is scanned
// as any other: a plain result is not taken for a Promise.

const test = require('node:test');
const assert = require('node:assert/strict');

const main = require('../src/index.js');
const { createDom, runa11yCoreOnDom } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

function withPatched(target, key, value, fn) {
  const had = Object.prototype.hasOwnProperty.call(target, key);
  const old = target[key];
  Object.defineProperty(target, key, { value, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    if (had) Object.defineProperty(target, key, { value: old, configurable: true, writable: true });
    else delete target[key];
  }
}

const scanBoth = () => {
  const dom = createDom(PAGE);
  return [
    () => runa11yCoreOnDom(dom, { entryPointParity: false }),
    () => main.runa11yCoreInPage('https://example.test/', null, {}, null)
  ];
};

test('a broken built-in stops the scan with PAGE_BUILTINS_BROKEN, naming it', () => {
  const cases = [
    [
      Array.prototype,
      'filter',
      function () {
        return this;
      },
      'Array.prototype.filter'
    ],
    [
      Array.prototype,
      'push',
      () => {
        throw new Error('push');
      },
      'Array.prototype.push'
    ],
    [
      Map.prototype,
      'set',
      function () {
        return this;
      },
      'Map'
    ],
    [
      JSON,
      'stringify',
      () => {
        throw new Error('json');
      },
      'JSON.stringify'
    ],
    [
      String.prototype,
      'toLowerCase',
      function () {
        return String(this);
      },
      'String.prototype.toLowerCase'
    ]
  ];
  const [, inPage] = scanBoth();
  for (const [target, key, value, name] of cases) {
    withPatched(target, key, value, () => {
      assert.throws(inPage, (err) => {
        assert.equal(err.code, 'PAGE_BUILTINS_BROKEN', name);
        assert.ok(err.broken.includes(name), `${name}: ${err.broken}`);
        assert.ok(err.message.includes(name), err.message);
        return true;
      });
    });
  }
});

test('a page adding then to Object.prototype is scanned as any other', () => {
  const [, inPage] = scanBoth();
  const expected = inPage();
  const result = withPatched(Object.prototype, 'then', function () {}, inPage);
  assert.equal(result.checksResults.length, expected.checksResults.length);
  assert.ok(result.checksResults.every((c) => !/Promise/.test(c.error || '')));
  assert.equal(result.checksResults.find((c) => c.ruleId === 'img-alt-present').outcome, 'fail');
});
