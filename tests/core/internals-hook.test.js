'use strict';

/**
 * The internals hook's script (internalsHookScript, src/core/internals-hook.js)
 * and how the engine reads its registry. The script is run on a stand-in
 * realm: an HTMLElement whose attachInternals is a stub, so what it returns
 * and throws is known. A page can define the registry's symbol itself, so a
 * registry not shaped as the hook makes it is ignored. The browser side is
 * tested in Chromium, in engine-checks/internals-hook-chromium.test.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { internalsHookScript } = require('../../src/index.js');
const { readInternalsHook } = require('../../src/core/internals-hook.js');
const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

const KEY = Symbol.for('surea11y.internals');

// Runs the script with `global` as its global object.
function install(global) {
  new Function('globalThis', internalsHookScript())(global);
}

// A realm with an HTMLElement whose attachInternals returns a fresh object,
// or throws `error` when given one.
function realm({ readyState = 'loading', error = null, descriptor = {} } = {}) {
  function HTMLElement() {}
  const calls = [];
  const original = function attachInternals() {
    calls.push({ self: this, args: Array.from(arguments) });
    if (error) throw error;
    return { internalsOf: this };
  };
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    value: original,
    writable: true,
    enumerable: true,
    configurable: true,
    ...descriptor
  });
  return { HTMLElement, document: { readyState }, original, calls };
}

test('the script parses, and holds nothing that evaluates text or ends an inline script', () => {
  const src = internalsHookScript();
  assert.doesNotThrow(() => new vm.Script(src));
  // As the body of a function, as WebDriver BiDi's addPreloadScript takes it.
  assert.doesNotThrow(() => new vm.Script(`(() => {\n${src}\n})`));
  assert.doesNotMatch(src, /\beval\b|\bFunction\(|<\/script/i);
  assert.equal(internalsHookScript(), src);
});

test('the wrapper keeps the original name, length and property attributes', () => {
  const g = realm();
  const before = Object.getOwnPropertyDescriptor(g.HTMLElement.prototype, 'attachInternals');
  install(g);
  const after = Object.getOwnPropertyDescriptor(g.HTMLElement.prototype, 'attachInternals');
  assert.notEqual(after.value, g.original);
  assert.equal(after.value.name, 'attachInternals');
  assert.equal(after.value.length, g.original.length);
  for (const k of ['writable', 'enumerable', 'configurable']) assert.equal(after[k], before[k]);
  assert.equal('prototype' in after.value, false);
});

test('the wrapper returns what the original returns, with the same this and arguments', () => {
  const g = realm();
  install(g);
  const el = new g.HTMLElement();
  const internals = el.attachInternals('extra');
  assert.deepEqual(internals, { internalsOf: el });
  assert.equal(g.calls[0].self, el);
  assert.deepEqual(g.calls[0].args, ['extra']);
  assert.equal(g[KEY].map.get(el), internals);
});

test("the original's error reaches the caller unchanged, and nothing is recorded", () => {
  const error = new Error('NotSupportedError');
  const g = realm({ error });
  install(g);
  const el = new g.HTMLElement();
  assert.throws(
    () => el.attachInternals(),
    (e) => e === error
  );
  assert.equal(g[KEY].map.has(el), false);
});

test('the registry is frozen, hidden, fixed, and says whether it came early', () => {
  const g = realm();
  install(g);
  const d = Object.getOwnPropertyDescriptor(g, KEY);
  assert.deepEqual(
    { enumerable: d.enumerable, writable: d.writable, configurable: d.configurable },
    { enumerable: false, writable: false, configurable: false }
  );
  assert.ok(Object.isFrozen(d.value));
  assert.equal(d.value.version, 1);
  assert.equal(d.value.early, true);
  assert.equal(Object.prototype.toString.call(d.value.map), '[object WeakMap]');
  assert.equal(d.value.attachInternals, g.HTMLElement.prototype.attachInternals);

  for (const readyState of ['interactive', 'complete']) {
    const late = realm({ readyState });
    install(late);
    assert.equal(late[KEY].early, false);
  }
});

test('installing it twice wraps once', () => {
  const g = realm();
  install(g);
  const wrapper = g.HTMLElement.prototype.attachInternals;
  install(g);
  assert.equal(g.HTMLElement.prototype.attachInternals, wrapper);
  new g.HTMLElement().attachInternals();
  assert.equal(g.calls.length, 1);
});

test('without HTMLElement or attachInternals, it does nothing and does not throw', () => {
  for (const g of [{}, { HTMLElement: function () {} }, { HTMLElement: 1 }]) {
    assert.doesNotThrow(() => install(g));
    assert.equal(Object.getOwnPropertySymbols(g).length, 0);
  }
});

test('a method it cannot replace is left alone, with no registry', () => {
  const g = realm({ descriptor: { writable: false, configurable: false } });
  install(g);
  assert.equal(g.HTMLElement.prototype.attachInternals, g.original);
  assert.equal(KEY in g, false);
});

test('a global that refuses the registry gets its own method back', () => {
  const g = realm();
  Object.preventExtensions(g);
  install(g);
  assert.equal(g.HTMLElement.prototype.attachInternals, g.original);
});

test('the engine reads a registry only when it is shaped as the hook makes it', () => {
  const g = realm();
  install(g);
  const read = readInternalsHook(g);
  assert.equal(read.early, true);
  assert.equal(read.map, g[KEY].map);

  const forged = (value) => {
    const w = realm();
    Object.defineProperty(w, KEY, { value });
    return readInternalsHook(w);
  };
  const spoofed = { get: () => ({}), [Symbol.toStringTag]: 'WeakMap' };
  assert.equal(forged(null), null);
  assert.equal(forged({ version: 1, early: true }), null);
  assert.equal(forged({ version: 1, early: true, map: new Map() }), null);
  assert.equal(forged({ version: 1, early: true, map: spoofed }), null);
  assert.equal(forged({ version: 2, early: true, map: new WeakMap() }), null);

  // A getter is never run.
  let ran = false;
  const w = realm();
  Object.defineProperty(w, KEY, {
    get() {
      ran = true;
      return { version: 1, early: true, map: new WeakMap() };
    }
  });
  assert.equal(readInternalsHook(w), null);
  assert.equal(ran, false);

  // A registry whose wrapper is no longer the realm's method proves nothing
  // about what it never saw.
  const replaced = realm();
  install(replaced);
  replaced.HTMLElement.prototype.attachInternals = function attachInternals() {};
  assert.equal(readInternalsHook(replaced).early, false);
});

// A jsdom page with an undefined-name custom checkbox that keeps its
// internals in a #private field.
function privateCheckbox(registry) {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><x-check role="checkbox"></x-check></main></body></html>'
  );
  const w = dom.window;
  if (registry === 'hook') install(w);
  else if (registry) Object.defineProperty(w, KEY, { value: registry(w) });
  w.customElements.define(
    'x-check',
    class extends w.HTMLElement {
      #internals;
      constructor() {
        super();
        this.#internals = this.attachInternals();
        this.#internals.ariaLabel = 'Subscribe';
      }
    }
  );
  return runa11yCoreOnDom(dom, { runOnly: ['binary-control-name-present'] });
}

const outcome = (result) =>
  result.checksResults.find((r) => r.ruleId === 'binary-control-name-present').outcome;

test('in jsdom, the hook reads #private internals and the result records it', () => {
  const without = privateCheckbox(null);
  assert.equal(outcome(without), 'cantTell');
  assert.deepEqual(without.engine.environment, { layout: false });

  const withHook = privateCheckbox('hook');
  assert.equal(outcome(withHook), 'pass');
  assert.deepEqual(withHook.engine.environment, { layout: false, internalsHook: 'early' });
});

test('a forged registry is ignored: the element stays a question, and no hook is recorded', () => {
  const forgeries = [
    () => ({ version: 1, early: true, map: new Map() }),
    () => ({ version: 1, early: true }),
    // A real WeakMap holding something that isn't ElementInternals.
    (w) => {
      const map = new WeakMap();
      const realSet = WeakMap.prototype.set;
      const define = w.customElements.define.bind(w.customElements);
      w.customElements.define = (name, ctor) => {
        define(name, ctor);
        for (const el of w.document.querySelectorAll(name)) {
          Reflect.apply(realSet, map, [el, { ariaLabel: 'Forged' }]);
        }
      };
      return { version: 1, early: false, map };
    }
  ];
  for (const forge of forgeries) {
    const result = privateCheckbox(forge);
    assert.equal(outcome(result), 'cantTell');
  }
  // A Map is no registry, so no hook is recorded. The WeakMap one is shaped
  // as the hook makes it, so it is, but what it holds isn't read.
  assert.equal(privateCheckbox(forgeries[0]).engine.environment.internalsHook, undefined);
  assert.equal(privateCheckbox(forgeries[2]).engine.environment.internalsHook, 'late');
});

// internalsHookScript({ early: true }) records the hook as early whatever the
// document's state, for an integrator that installs it before any of the
// page's or test's code runs though the document has loaded: a jsdom test
// setup file, before any component is defined (#234).
test('early: true records the hook as early on a document that has loaded', () => {
  const run = (options, readyState) => {
    const r = realm({ readyState });
    new Function('globalThis', internalsHookScript(options))(r);
    return r[KEY].early;
  };
  assert.equal(run(undefined, 'complete'), false);
  assert.equal(run({ early: false }, 'complete'), false);
  assert.equal(run({ early: true }, 'complete'), true);
  assert.equal(run({ early: true }, 'loading'), true);
  assert.equal(internalsHookScript({}), internalsHookScript());
  assert.notEqual(internalsHookScript({ early: true }), internalsHookScript());
});

test('internalsHookScript refuses options it does not know', () => {
  for (const bad of [null, 1, 'early', [], { earli: true }, { early: 'yes' }]) {
    assert.throws(() => internalsHookScript(bad), TypeError, String(bad));
  }
});

test('in jsdom after load, an early hook judges an element that never attached internals', () => {
  const scan = (options) => {
    const dom = createDom(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><x-plain role="checkbox"></x-plain></main></body></html>'
    );
    const w = dom.window;
    // A test environment's document has loaded before the setup file runs.
    Object.defineProperty(w.document, 'readyState', { get: () => 'complete' });
    new Function('globalThis', internalsHookScript(options))(w);
    w.customElements.define('x-plain', class extends w.HTMLElement {});
    return runa11yCoreOnDom(dom, { runOnly: ['binary-control-name-present'] });
  };
  const late = scan();
  assert.equal(late.engine.environment.internalsHook, 'late');
  assert.equal(outcome(late), 'cantTell');
  const early = scan({ early: true });
  assert.equal(early.engine.environment.internalsHook, 'early');
  // No name from its markup, and the hook saw it never attach internals.
  assert.equal(outcome(early), 'fail');
});

// Vitest copies a jsdom window's classes onto Node's global as getters. The
// reader runs no getter, so it reads the prototype the hook patched from the
// registry itself, and an early hook stays early there.
test('a window whose HTMLElement is a getter, as under Vitest, keeps an early hook early', () => {
  const g = realm();
  const HTMLElement = g.HTMLElement;
  delete g.HTMLElement;
  let getterRan;
  Object.defineProperty(g, 'HTMLElement', {
    get() {
      getterRan = true;
      return HTMLElement;
    },
    configurable: true
  });
  install(g);
  getterRan = false;
  const hook = readInternalsHook(g);
  assert.equal(hook.early, true);
  assert.equal(getterRan, false, 'the reader ran no getter');
  assert.equal(g[Symbol.for('surea11y.internals')].proto, HTMLElement.prototype);
});

test('a registry from before it kept the prototype is checked against the window, as it was', () => {
  const g = realm();
  install(g);
  const registry = g[Symbol.for('surea11y.internals')];
  const old = {};
  Object.defineProperty(old, Symbol.for('surea11y.internals'), {
    value: Object.freeze({
      version: 1,
      early: true,
      map: registry.map,
      attachInternals: registry.attachInternals
    })
  });
  old.HTMLElement = g.HTMLElement;
  assert.equal(readInternalsHook(old).early, true);
  old.HTMLElement = function Other() {};
  assert.equal(readInternalsHook(old).early, false);
});
