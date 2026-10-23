/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The listener hook: an opt-in script that lets a scan see the event
 * listeners a page adds from script.
 *
 * The keyboard rules read inline handlers (onclick="…") from the markup, but
 * most pages add theirs with addEventListener, which no page script can list
 * afterwards. The hook, run in a page before the page's own scripts, wraps
 * EventTarget.prototype.addEventListener and removeEventListener and records,
 * for each target, which of the event types the rules ask about it has
 * listeners for; the engine reads them from there (getEventListenerInfo in
 * src/core/dom-helpers.js).
 *
 * The page gets exactly what it would have: the originals are called with the
 * same `this` and arguments, their result is returned as it is, and an error
 * they throw reaches the caller unchanged. Listeners are not wrapped, so the
 * page removes them with the same function it added, and an event reaches
 * them as it would. The wrappers keep the originals' names, lengths and
 * property attributes; they do not pretend to be native code.
 *
 * Only these types are recorded (LISTENER_TYPES): clicks, keys, focus, and
 * the mouse events mouse-only-event-handlers asks about. A listener of any
 * other type costs one Set lookup. Each target keeps a count per type and
 * capture phase of listeners added and not removed; a listener added with
 * `once`, or with a `signal` that later aborts, is still counted after it
 * goes, as the hook does not wrap it to learn when: a listener the hook saw
 * is one the page added, which is what the rules judge.
 *
 * The registry it leaves is a frozen object on the global, under
 * Symbol.for('surea11y.listeners'), which no page markup or named access can
 * produce: { version: 1, early, proto, map, addEventListener, removeEventListener }.
 * `proto` is the prototype it patched (EventTarget.prototype), so core can
 * tell its wrapper is still in place without reading the page's globals.
 * `map` is a WeakMap from a target to an object of counts by type. `early`
 * is whether it was installed while the document was still loading, as an
 * init script is (Playwright's addInitScript, Puppeteer's
 * evaluateOnNewDocument, CDP's Page.addScriptToEvaluateOnNewDocument). Only
 * an early hook has seen every listener, so only then does an element
 * missing from the map prove it has none.
 *
 * Nothing here runs unless an integrator injects the script: core never
 * installs it. Each frame is its own realm and needs its own copy.
 *
 * readListenerHook is inlined into generated core.js (scripts/build-core.js)
 * next to the helpers that read it, so it is self-contained.
 */

// The event types recorded: what click-handler-keyboard-operable,
// mouse-only-event-handlers and widget-keyboard-focusable ask about.
const LISTENER_TYPES = [
  'click',
  'keydown',
  'keyup',
  'keypress',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'mouseover',
  'mouseout',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'dblclick'
];

// The script, as text, so a bundler or a coverage tool never rewrites it.
// Plain ES2015, with no eval, so it runs under any Content Security Policy
// that lets the init script itself run.
const LISTENER_HOOK_SOURCE = [
  '// The listener hook for @surea11y/core (listenerHookScript): records which',
  '// event listeners each element has, so a scan can see those added by script.',
  '(function (global) {',
  "  'use strict';",
  '  try {',
  "    var KEY = Symbol.for('surea11y.listeners');",
  '    if (!global || Object.prototype.hasOwnProperty.call(global, KEY)) return;',
  '    var Ctor = global.EventTarget;',
  "    var proto = typeof Ctor === 'function' ? Ctor.prototype : null;",
  "    var addDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'addEventListener') : null;",
  "    var removeDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'removeEventListener') : null;",
  '    var add = addDesc && addDesc.value;',
  '    var remove = removeDesc && removeDesc.value;',
  "    if (typeof add !== 'function' || typeof remove !== 'function') return;",
  '    var apply = Reflect.apply;',
  '    var mapGet = WeakMap.prototype.get;',
  '    var mapSet = WeakMap.prototype.set;',
  '    var MapCtor = Map;',
  '    var get = Map.prototype.get;',
  '    var set = Map.prototype.set;',
  '    var del = Map.prototype.delete;',
  '    var size = Object.getOwnPropertyDescriptor(Map.prototype, "size").get;',
  `    var TYPES = new Set(${JSON.stringify(LISTENER_TYPES)});`,
  '    var has = Set.prototype.has;',
  '    var map = new WeakMap();',
  // The capture flag of the options argument, as the DOM reads it.
  '    function captureOf(options) {',
  "      if (options && typeof options === 'object') return !!options.capture;",
  '      return !!options;',
  '    }',
  // A listener is one entry per (type, listener), with a bit per phase, so
  // adding the same one twice counts once, as the DOM keeps it once. A call
  // with no `this` (addEventListener(...) on its own) adds to the global, as
  // the DOM does.
  '    function note(target, type, listener, options, adding) {',
  "      if (typeof type !== 'string' || !apply(has, TYPES, [type])) return;",
  "      if (!listener || (typeof listener !== 'function' && typeof listener !== 'object')) return;",
  '      var bit = captureOf(options) ? 2 : 1;',
  '      var byType = apply(mapGet, map, [target]);',
  '      if (!byType) {',
  '        if (!adding) return;',
  '        byType = new MapCtor();',
  '        apply(mapSet, map, [target, byType]);',
  '      }',
  '      var byListener = apply(get, byType, [type]);',
  '      if (!byListener) {',
  '        if (!adding) return;',
  '        byListener = new MapCtor();',
  '        apply(set, byType, [type, byListener]);',
  '      }',
  '      var mask = apply(get, byListener, [listener]) || 0;',
  '      mask = adding ? mask | bit : mask & ~bit;',
  '      if (mask) apply(set, byListener, [listener, mask]);',
  '      else apply(del, byListener, [listener]);',
  '      if (!apply(size, byListener, [])) apply(del, byType, [type]);',
  '    }',
  '    var wrappers = {',
  '      addEventListener(type, listener, options) {',
  '        var result = apply(add, this, arguments);',
  '        try {',
  '          note(this == null ? global : this, type, listener, options, true);',
  '        } catch (e) {}',
  '        return result;',
  '      },',
  '      removeEventListener(type, listener, options) {',
  '        var result = apply(remove, this, arguments);',
  '        try {',
  '          note(this == null ? global : this, type, listener, options, false);',
  '        } catch (e) {}',
  '        return result;',
  '      }',
  '    };',
  '    var addWrapper = wrappers.addEventListener;',
  '    var removeWrapper = wrappers.removeEventListener;',
  "    Object.defineProperty(addWrapper, 'name', { value: add.name, configurable: true });",
  "    Object.defineProperty(addWrapper, 'length', { value: add.length, configurable: true });",
  "    Object.defineProperty(removeWrapper, 'name', { value: remove.name, configurable: true });",
  "    Object.defineProperty(removeWrapper, 'length', { value: remove.length, configurable: true });",
  '    var early = false;',
  '    try {',
  "      early = !!global.document && global.document.readyState === 'loading';",
  '    } catch (e) {}',
  '    var registry = Object.freeze({',
  '      version: 1,',
  '      early: early,',
  '      proto: proto,',
  '      map: map,',
  '      addEventListener: addWrapper,',
  '      removeEventListener: removeWrapper',
  '    });',
  '    function put(name, desc, value) {',
  '      Object.defineProperty(proto, name, {',
  '        value: value,',
  '        writable: desc.writable,',
  '        enumerable: desc.enumerable,',
  '        configurable: desc.configurable',
  '      });',
  '    }',
  "    put('addEventListener', addDesc, addWrapper);",
  "    put('removeEventListener', removeDesc, removeWrapper);",
  // An event handler property (el.onclick = fn) is a listener too: its setter
  // is wrapped where the DOM defines it, recording a function as one listener
  // under a key of its own and anything else as none.
  '    var PROPERTY = {};',
  // A [Global] interface's attributes are the global's own properties (the
  // window's onkeydown in Chromium), so the global is an owner too.
  '    var owners = [global.HTMLElement, global.SVGElement, global.MathMLElement, global.Document, global.Window, global];',
  '    var props = [];',
  '    var typeList = Array.from(TYPES);',
  '    for (var o = 0; o < owners.length; o++) {',
  '      var owner = owners[o] === global ? global : typeof owners[o] === "function" ? owners[o].prototype : null;',
  '      if (!owner) continue;',
  '      for (var t = 0; t < typeList.length; t++) {',
  "        var name = 'on' + typeList[t];",
  '        var pd = Object.getOwnPropertyDescriptor(owner, name);',
  "        if (!pd || typeof pd.set !== 'function' || !pd.configurable) continue;",
  '        props.push([owner, name, pd, typeList[t]]);',
  '      }',
  '    }',
  '    function wrapSetter(entry) {',
  '      var original = entry[2];',
  '      var type = entry[3];',
  '      var setter = {',
  '        set value(v) {',
  '          apply(original.set, this, [v]);',
  '          try {',
  "            note(this == null ? global : this, type, PROPERTY, false, typeof v === 'function');",
  '          } catch (e) {}',
  '        }',
  '      };',
  "      var wrapped = Object.getOwnPropertyDescriptor(setter, 'value').set;",
  "      Object.defineProperty(wrapped, 'name', { value: original.set.name, configurable: true });",
  '      Object.defineProperty(entry[0], entry[1], {',
  '        get: original.get,',
  '        set: wrapped,',
  '        enumerable: original.enumerable,',
  '        configurable: true',
  '      });',
  '    }',
  '    for (var p = 0; p < props.length; p++) wrapSetter(props[p]);',
  '    try {',
  '      Object.defineProperty(global, KEY, { value: registry });',
  '    } catch (e) {',
  "      Object.defineProperty(proto, 'addEventListener', addDesc);",
  "      Object.defineProperty(proto, 'removeEventListener', removeDesc);",
  '      for (var q = 0; q < props.length; q++) Object.defineProperty(props[q][0], props[q][1], props[q][2]);',
  '    }',
  '  } catch (e) {}',
  "})(typeof globalThis !== 'undefined' ? globalThis : this);",
  ''
].join('\n');

const EARLY_LINE = "      early = !!global.document && global.document.readyState === 'loading';";
const LISTENER_HOOK_SOURCE_EARLY = LISTENER_HOOK_SOURCE.replace(EARLY_LINE, '      early = true;');

// The hook's script, to run in every frame of a page before the page's own
// scripts. `early: true` is a promise the caller makes: that no code of the
// page's or the test's has run yet, so the hook sees every listener added.
// Only the first copy installed in a realm counts.
const checked = new Set();
function listenerHookScript(options) {
  if (options !== undefined) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('listenerHookScript(options): options must be an object.');
    }
    const unknown = Object.keys(options).filter((k) => k !== 'early');
    if (unknown.length) {
      throw new TypeError(
        `listenerHookScript(options): no option named ${unknown.map((k) => `"${k}"`).join(', ')}; use early.`
      );
    }
    if (options.early !== undefined && typeof options.early !== 'boolean') {
      throw new TypeError('listenerHookScript(options): early must be true or false.');
    }
  }
  const source =
    options && options.early === true ? LISTENER_HOOK_SOURCE_EARLY : LISTENER_HOOK_SOURCE;
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
          `listenerHookScript wrote a script that does not parse: ${e && e.message}`,
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

// The registry the hook left in a window, as { early, has(target, type) },
// or null when there is none or it isn't shaped as the hook makes it: a page
// can define that symbol itself. Read through property descriptors, so no
// getter on it runs, and the maps through this realm's prototypes, which
// throw on anything that isn't one. `early` holds only while the hook's
// wrapper is still the realm's addEventListener: a page that replaced it
// afterwards may add listeners the hook never sees.
function readListenerHook(win) {
  try {
    if (!win || (typeof win !== 'object' && typeof win !== 'function')) return null;
    const own = (o, key) => {
      const d = o && Object.getOwnPropertyDescriptor(o, key);
      return d && 'value' in d ? d.value : undefined;
    };
    const registry = own(win, Symbol.for('surea11y.listeners'));
    if (!registry || typeof registry !== 'object' || own(registry, 'version') !== 1) return null;
    const map = own(registry, 'map');
    if (!map || Object.prototype.toString.call(map) !== '[object WeakMap]') return null;
    const weakGet = WeakMap.prototype.get;
    Reflect.apply(weakGet, map, [registry]);
    const mapGet = Map.prototype.get;
    const mapSize = Object.getOwnPropertyDescriptor(Map.prototype, 'size').get;
    let early = own(registry, 'early') === true;
    if (early) {
      // The prototype the hook patched, which it keeps in the registry, else
      // (a registry from before it kept one) the window's own. Read through
      // data properties only: in a test runner that copies a window's classes
      // onto Node's global as getters (Vitest), the window has no data
      // property named EventTarget, but the registry still has the prototype.
      let proto = own(registry, 'proto');
      if (!proto || (typeof proto !== 'object' && typeof proto !== 'function')) {
        const ctor = own(win, 'EventTarget');
        proto = typeof ctor === 'function' ? own(ctor, 'prototype') : null;
      }
      const current = proto ? own(proto, 'addEventListener') : undefined;
      if (typeof current !== 'function' || current !== own(registry, 'addEventListener')) {
        early = false;
      }
    }
    // Whether the target has a listener of that type, by the hook's record.
    function has(target, type) {
      try {
        const byType = Reflect.apply(weakGet, map, [target]);
        if (!byType) return false;
        const byListener = Reflect.apply(mapGet, byType, [type]);
        return !!byListener && Reflect.apply(mapSize, byListener, []) > 0;
      } catch {
        return false;
      }
    }
    return { early, has };
  } catch {
    return null;
  }
}

module.exports = {
  LISTENER_HOOK_SOURCE,
  LISTENER_TYPES,
  listenerHookScript,
  readListenerHook
};
