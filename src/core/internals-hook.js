/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The internals hook: an opt-in script that lets a scan read the
 * ElementInternals a custom element keeps to itself.
 *
 * A custom element can give itself a name and states with attachInternals()
 * (internals.ariaLabel = 'Save'). Browsers expose them, but no page script
 * can read them back unless the component leaves its internals somewhere
 * the engine can reach, so for a component that keeps them in a #private
 * field the name rules ask (name_internals, state_internals) instead of
 * deciding. The hook, run in a page before the page's own scripts, wraps
 * HTMLElement.prototype.attachInternals and records each element's internals
 * as the browser hands them out; the engine reads them from there
 * (getCustomElementInternals in src/core/dom-helpers.js).
 *
 * The page gets exactly what it would have: the original is called with the
 * same `this` and arguments, its result is returned as it is, and an error it
 * throws reaches the caller unchanged. The wrapper keeps the original's name,
 * length and property attributes; it does not pretend to be native code.
 *
 * The registry it leaves is a frozen object on the global, under
 * Symbol.for('surea11y.internals'), which no page markup or named access can
 * produce: { version: 1, early, proto, map, attachInternals }. `proto` is the
 * prototype it patched (HTMLElement.prototype), so core can tell its wrapper
 * is still in place without reading the page's globals. `early` is whether it
 * was installed while the document was still loading, which an init script
 * (Playwright's addInitScript, Puppeteer's evaluateOnNewDocument, CDP's
 * Page.addScriptToEvaluateOnNewDocument) is and a page.evaluate after load is
 * not. Only an early hook has seen every attachInternals call, so only then
 * does an element missing from the map prove it has no internals.
 *
 * Nothing here runs unless an integrator injects the script: core never
 * installs it. Each frame is its own realm and needs its own copy. The
 * registry is on the page's global, so any script in the page can read it as
 * the engine does: it is for test and audit runs.
 *
 * readInternalsHook is inlined into generated core.js (scripts/build-core.js)
 * next to the helpers that read it, so it is self-contained.
 */

// The script, as text, so a bundler or a coverage tool never rewrites it: a
// function's toString() would carry whatever they added. Written as plain
// ES2015, with no eval, so it runs under any Content Security Policy that lets
// the init script itself run.
const INTERNALS_HOOK_SOURCE = [
  '// The internals hook for @surea11y/core (internalsHookScript): records the',
  '// ElementInternals each custom element attaches, so a scan can read them.',
  '(function (global) {',
  "  'use strict';",
  '  try {',
  "    var KEY = Symbol.for('surea11y.internals');",
  // Installed once per realm, whichever copy ran first.
  '    if (!global || Object.prototype.hasOwnProperty.call(global, KEY)) return;',
  '    var Ctor = global.HTMLElement;',
  "    var proto = typeof Ctor === 'function' ? Ctor.prototype : null;",
  "    var desc = proto ? Object.getOwnPropertyDescriptor(proto, 'attachInternals') : null;",
  '    var original = desc && desc.value;',
  // An old browser, or a realm with no elements (a worker): nothing to do.
  "    if (typeof original !== 'function') return;",
  '    var apply = Reflect.apply;',
  '    var record = WeakMap.prototype.set;',
  '    var map = new WeakMap();',
  // A method, like the original: not a constructor, and no prototype.
  '    var wrapper = {',
  '      attachInternals() {',
  '        var internals = apply(original, this, arguments);',
  '        try {',
  '          apply(record, map, [this, internals]);',
  '        } catch (e) {}',
  '        return internals;',
  '      }',
  '    }.attachInternals;',
  "    Object.defineProperty(wrapper, 'name', { value: original.name, configurable: true });",
  "    Object.defineProperty(wrapper, 'length', { value: original.length, configurable: true });",
  '    var early = false;',
  '    try {',
  "      early = !!global.document && global.document.readyState === 'loading';",
  '    } catch (e) {}',
  '    var registry = Object.freeze({',
  '      version: 1,',
  '      early: early,',
  '      proto: proto,',
  '      map: map,',
  '      attachInternals: wrapper',
  '    });',
  "    Object.defineProperty(proto, 'attachInternals', {",
  '      value: wrapper,',
  '      writable: desc.writable,',
  '      enumerable: desc.enumerable,',
  '      configurable: desc.configurable',
  '    });',
  '    try {',
  '      Object.defineProperty(global, KEY, { value: registry });',
  '    } catch (e) {',
  // No registry, no hook: the page gets its own method back.
  "      Object.defineProperty(proto, 'attachInternals', desc);",
  '    }',
  '  } catch (e) {}',
  "})(typeof globalThis !== 'undefined' ? globalThis : this);",
  ''
].join('\n');

// The same script, recording itself as early whatever the document's state:
// for an integrator that runs it before any of the page's or test's code,
// where the document has already loaded (a jsdom test environment's setup
// file, before any component is defined).
const EARLY_LINE = "      early = !!global.document && global.document.readyState === 'loading';";
const INTERNALS_HOOK_SOURCE_EARLY = INTERNALS_HOOK_SOURCE.replace(
  EARLY_LINE,
  '      early = true;'
);

// The hook's script, to run in every frame of a page before the page's own
// scripts. `early: true` is a promise the caller makes: that no code of the
// page's or the test's has run yet, so the hook sees every attachInternals
// call. If it's false, elements that attached internals before the hook are
// judged on their markup. Only the first copy installed in a realm counts.
// What is written must parse; it is checked in Node, and a browser bundle of
// the main entry (a Cypress spec) skips the check rather than pull in node:vm.
const checked = new Set();
function internalsHookScript(options) {
  if (options !== undefined) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('internalsHookScript(options): options must be an object.');
    }
    const unknown = Object.keys(options).filter((k) => k !== 'early');
    if (unknown.length) {
      throw new TypeError(
        `internalsHookScript(options): no option named ${unknown.map((k) => `"${k}"`).join(', ')}; use early.`
      );
    }
    if (options.early !== undefined && typeof options.early !== 'boolean') {
      throw new TypeError('internalsHookScript(options): early must be true or false.');
    }
  }
  const source =
    options && options.early === true ? INTERNALS_HOOK_SOURCE_EARLY : INTERNALS_HOOK_SOURCE;
  if (!checked.has(source)) {
    const nodeRequire =
      typeof module === 'object' && module && typeof module.require === 'function'
        ? (id) => module.require(id)
        : null;
    if (nodeRequire) {
      try {
        new (nodeRequire('node:vm').Script)(source);
      } catch (e) {
        throw new Error(
          `internalsHookScript wrote a script that does not parse: ${e && e.message}`,
          {
            cause: e
          }
        );
      }
    }
    checked.add(source);
  }
  return source;
}

// The registry the hook left in a window, as { early, map, get }, or null
// when there is none or it isn't shaped as the hook makes it: a page can
// define that symbol itself. Read through property descriptors, so no getter
// on it runs, and the map through this realm's WeakMap.prototype.get, which
// throws on anything that isn't a WeakMap, whatever it calls itself. `early`
// holds only while the hook's wrapper is still the realm's attachInternals:
// a page that replaced it afterwards (a polyfill) may hand out internals the
// hook never sees, so a missing entry proves nothing then.
function readInternalsHook(win) {
  try {
    if (!win || (typeof win !== 'object' && typeof win !== 'function')) return null;
    const own = (o, key) => {
      const d = o && Object.getOwnPropertyDescriptor(o, key);
      return d && 'value' in d ? d.value : undefined;
    };
    const registry = own(win, Symbol.for('surea11y.internals'));
    if (!registry || typeof registry !== 'object' || own(registry, 'version') !== 1) return null;
    const map = own(registry, 'map');
    if (!map || Object.prototype.toString.call(map) !== '[object WeakMap]') return null;
    const get = WeakMap.prototype.get;
    Reflect.apply(get, map, [registry]);
    let early = own(registry, 'early') === true;
    if (early) {
      // The prototype the hook patched, which it keeps in the registry, else
      // (a registry from before it kept one) the window's own. Read through
      // data properties only: in a test runner that copies a window's classes
      // onto Node's global as getters (Vitest), the window has no data
      // property named HTMLElement, but the registry still has the prototype.
      let proto = own(registry, 'proto');
      if (!proto || (typeof proto !== 'object' && typeof proto !== 'function')) {
        const ctor = own(win, 'HTMLElement');
        proto = typeof ctor === 'function' ? own(ctor, 'prototype') : null;
      }
      const current = proto ? own(proto, 'attachInternals') : undefined;
      if (typeof current !== 'function' || current !== own(registry, 'attachInternals')) {
        early = false;
      }
    }
    return { early, map, get };
  } catch {
    return null;
  }
}

module.exports = { INTERNALS_HOOK_SOURCE, internalsHookScript, readInternalsHook };
