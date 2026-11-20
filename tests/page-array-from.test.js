'use strict';

// A page whose scripts replace Array.from, as Prototype and MooTools do, is
// scanned, and gives what the same page gives with the built-ins intact:
// core's own code doesn't use Array.from. A pack's or caller's rule that
// uses it stops the scan with PAGE_BUILTINS_BROKEN instead, as it would give
// a result that reads well and is wrong. The Chromium side is in
// page-array-from-browser.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const main = require('../src/index.js');
const { createDom, runa11yCoreOnDom } = require('../src/testing.js');
const { assertArrayFromFor } = require('../src/core/dom-runner.js');
const {
  PATCHES,
  pageHtml,
  DATA_RULE_SOURCE,
  ARRAY_FROM_RULE_SOURCE,
  customRule,
  stable
} = require('./helpers/replaced-builtins.js');

// Runs the patch in this realm, where the engine runs under jsdom, for the
// length of fn, and puts back what it changed.
function withPagePatch(source, fn) {
  const targets = [Array, Array.prototype, String.prototype];
  const saved = targets.map((t) => Object.getOwnPropertyDescriptors(t));
  try {
    new Function(source)();
    return fn();
  } finally {
    targets.forEach((t, i) => {
      for (const key of Reflect.ownKeys(t)) {
        if (!(key in saved[i])) delete t[key];
      }
      for (const [key, desc] of Object.entries(saved[i])) Object.defineProperty(t, key, desc);
    });
  }
}

const DATA_RULE = customRule('acme-data', new Function(`return (${DATA_RULE_SOURCE})`)());

const OPTION_SETS = [{}, { customRules: [DATA_RULE] }, { profile: ['wcag22-aa', 'wcag20-aa'] }];

function scans(engineOptions) {
  const dom = createDom(pageHtml(''));
  return {
    onDom: () => runa11yCoreOnDom(dom, { engineOptions, entryPointParity: false }),
    inPage: () => main.runa11yCoreInPage('https://example.test/', null, engineOptions, null)
  };
}

test('a page that replaced Array.from is scanned as it is with the built-in intact', () => {
  for (const engineOptions of OPTION_SETS) {
    const { onDom, inPage } = scans(engineOptions);
    const expected = { onDom: stable(onDom()), inPage: stable(inPage()) };
    for (const [name, patch] of Object.entries(PATCHES)) {
      const label = `${name}, ${JSON.stringify(engineOptions)}`;
      const got = withPagePatch(patch, () => ({
        onDom: stable(onDom()),
        inPage: stable(inPage())
      }));
      assert.deepEqual(got.onDom, expected.onDom, `runa11yCoreOnDom: ${label}`);
      assert.deepEqual(got.inPage, expected.inPage, `runa11yCoreInPage: ${label}`);
    }
  }
});

test('what a replaced Array.from got wrong is right on the clean page', () => {
  // The cases the patched scans are compared on: if these change, the
  // comparison above no longer covers them.
  const { inPage } = scans({ customRules: [DATA_RULE] });
  const result = inPage();
  const rule = (id) => result.checksResults.find((c) => c.ruleId === id);
  const altQuality = rule('img-alt-quality').occurrences[0].data.details;
  assert.notEqual(altQuality.altSignal, 'too-long', 'an alt of 80 characters is not too long');
  const typo = rule('aria-roles-valid').occurrences.find((o) => o.lean);
  assert.ok(typo, 'role="buton" is a near miss');
  assert.equal(typo.lean.signals.find((s) => s.signal === 'nearest-known-role').value, 'button');
  const data = rule('acme-data').occurrences[0].data.details;
  assert.deepEqual(data.seen, [['a', 1]]);
  assert.deepEqual(data.ids, ['x', 'y']);
});

test('a caller rule that uses Array.from stops the scan on such a page, only when it runs', () => {
  const rule = customRule('acme-from', new Function(`return (${ARRAY_FROM_RULE_SOURCE})`)());
  const ruleAsSource = customRule('acme-from', ARRAY_FROM_RULE_SOURCE);
  for (const [name, patch] of Object.entries(PATCHES)) {
    for (const r of [rule, ruleAsSource]) {
      const { onDom, inPage } = scans({ customRules: [r] });
      for (const scan of [onDom, inPage]) {
        withPagePatch(patch, () =>
          assert.throws(scan, (err) => {
            assert.equal(err.code, 'PAGE_BUILTINS_BROKEN', name);
            assert.deepEqual(err.broken, ['Array.from']);
            assert.match(err.message, /\(Array\.from\)/);
            return true;
          })
        );
      }
    }
    // Left out by the selection, the rule doesn't run, and the scan goes ahead.
    const dom = createDom(pageHtml(''));
    const result = withPagePatch(patch, () =>
      runa11yCoreOnDom(dom, {
        runOnly: ['img-alt-present'],
        engineOptions: { customRules: [rule] },
        entryPointParity: false
      })
    );
    assert.ok(
      result.checksResults.some((c) => c.ruleId === 'img-alt-present'),
      name
    );
  }
  // With Array.from intact, the rule runs.
  const { inPage } = scans({ customRules: [rule] });
  assert.equal(inPage().checksResults.find((c) => c.ruleId === 'acme-from').outcome, 'pass');
});

test('assertArrayFromFor: only a rule whose source uses Array.from, and only when it is broken', () => {
  const uses = function () {
    return Array.from(new Set([1]));
  };
  const doesNot = function () {
    return [...new Set([1])];
  };
  assert.doesNotThrow(() => assertArrayFromFor([uses, doesNot, null]));
  withPagePatch(PATCHES['Prototype-like'], () => {
    assert.doesNotThrow(() => assertArrayFromFor([doesNot, null, undefined]));
    assert.throws(() => assertArrayFromFor([doesNot, uses]), { code: 'PAGE_BUILTINS_BROKEN' });
  });
});

test('the built-ins core reads lists and strings with are checked', () => {
  const cases = [
    [Set.prototype, Symbol.iterator, function* () {}, 'Set iteration'],
    [Map.prototype, Symbol.iterator, function* () {}, 'Map iteration'],
    [String.prototype, Symbol.iterator, function* () {}, 'String iteration'],
    [
      String.prototype,
      'startsWith',
      // Old libraries' startsWith, which ignores the position.
      function (s) {
        return this.indexOf(s) === 0;
      },
      'String.prototype.startsWith'
    ]
  ];
  const { inPage } = scans({});
  for (const [target, key, value, name] of cases) {
    const old = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
    try {
      assert.throws(inPage, (err) => {
        assert.equal(err.code, 'PAGE_BUILTINS_BROKEN', name);
        assert.ok(err.broken.includes(name), `${name}: ${err.broken}`);
        return true;
      });
    } finally {
      Object.defineProperty(target, key, old);
    }
  }
});

test('the in-page runner and the browser bundle call Array.from only to check it', () => {
  const count = (s) => s.split('Array.from(').length - 1;
  const own = count(assertArrayFromFor.toString());
  assert.equal(count(main.runa11yCoreInPage.toString()), own, 'runa11yCoreInPage');
  const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.equal(count(read('surea11y.browser.js')), own, 'surea11y.browser.js');
  assert.equal(count(read('surea11y.report.js')), 0, 'surea11y.report.js');
});
