'use strict';

// Whatever a pack's or a caller's rule throws or returns, the scan returns
// a result: a value that can't be described, or a result that can't be
// read, makes that rule cantTell, and its data is made plain, so the result
// can be written as JSON and cloned. In Node, and in a page with the pack
// registered.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../src/index.js');
const { definePack, packScript } = require('../src/pack.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"></main></body></html>';

function scan(run, engineOptions) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return run('https://example.test/', null, {
      timestamp: '2026-10-10T00:00:00.000Z',
      ...engineOptions
    });
  } finally {
    dom.window.close();
  }
}

const rule = (id, runInPage) => ({ id, meta: { title: id }, runInPage });

const UNREADABLE = [
  rule('acme-throws-undescribable', () => {
    throw {
      toString() {
        throw new Error('nested');
      }
    };
  }),
  rule('acme-outcome-getter', () => ({
    get outcome() {
      throw new Error('getter');
    }
  })),
  rule(
    'acme-proxy-result',
    () =>
      new Proxy(
        {},
        {
          get() {
            throw new Error('proxy');
          },
          ownKeys() {
            throw new Error('proxy');
          }
        }
      )
  )
];

// Self-contained, as a page gets the function alone.
const ODD_DATA = rule('acme-odd-data', (ctx) => {
  const circular = { a: 1 };
  circular.self = circular;
  return {
    outcome: 'fail',
    occurrences: [
      {
        __node: ctx.document.body,
        data: {
          details: {
            reasonCode: 'X',
            circular,
            big: BigInt(10),
            el: ctx.document.body,
            date: new Date(0),
            map: new Map([[1, 2]]),
            set: new Set(['a']),
            fn() {},
            sym: Symbol('s')
          }
        }
      }
    ]
  };
});

function check(result, label) {
  const own = (id) => result.checksResults.find((c) => c.ruleId === id);
  assert.match(
    own('acme-throws-undescribable').error,
    /The rule threw a value that can't be described/,
    label
  );
  assert.match(own('acme-outcome-getter').error, /result could not be read: getter/, label);
  assert.match(own('acme-proxy-result').error, /result could not be read: proxy/, label);
  for (const r of UNREADABLE) assert.equal(own(r.id).outcome, 'cantTell', label);
  const odd = own('acme-odd-data');
  assert.equal(odd.outcome, 'fail', label);
  assert.equal(odd.occurrences[0].selector, 'html > body', label);
  assert.deepEqual(
    odd.occurrences[0].data.details,
    {
      reasonCode: 'X',
      circular: { a: 1, self: '[circular]' },
      big: '10',
      el: '<body>',
      date: '1970-01-01T00:00:00.000Z',
      map: [[1, 2]],
      set: ['a']
    },
    label
  );
  assert.doesNotThrow(() => JSON.stringify(result), label);
  assert.doesNotThrow(() => structuredClone(result), label);
  assert.equal(own('img-alt-present').outcome, 'fail', label);
}

test('a custom rule that throws or returns anything leaves the scan whole', () => {
  check(
    scan(main.runDomRulesInPage, { customRules: UNREADABLE.concat(ODD_DATA) }),
    'runDomRulesInPage'
  );
});

test('a pack rule that throws or returns anything leaves the scan whole, in Node and in a page', () => {
  const pack = definePack({
    name: '@acme/odd',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: UNREADABLE.concat(ODD_DATA)
  });
  check(scan(main.runDomRulesInPage, { packs: [pack] }), 'Node');
  new Function(packScript([pack]))();
  try {
    check(scan(main.runa11yCoreInPage, { packs: ['@acme/odd@1.0.0'] }), 'page');
  } finally {
    delete globalThis.__surea11yPacks;
  }
});

test('a rule reporting many occurrences is made plain quickly', () => {
  const many = rule('acme-many', (ctx) => ({
    outcome: 'fail',
    occurrences: Array.from({ length: 20000 }, (_, i) => ({
      __node: ctx.document.body,
      data: { details: { reasonCode: 'X', i } }
    }))
  }));
  const t = Date.now();
  const result = scan(main.runDomRulesInPage, { customRules: [many] });
  const elapsed = Date.now() - t;
  assert.equal(
    result.checksResults.find((c) => c.ruleId === 'acme-many').occurrences.length,
    20000
  );
  assert.ok(elapsed < 20000, `${elapsed} ms`);
});
