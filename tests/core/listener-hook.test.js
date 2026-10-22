'use strict';

/**
 * The listener hook's script (listenerHookScript, src/core/listener-hook.js),
 * how the engine reads its registry, and what the keyboard rules make of the
 * listeners it records. Run in jsdom, and on a stand-in realm where what the
 * original methods return and throw is known. A page can define the
 * registry's symbol itself, so a registry not shaped as the hook makes it is
 * ignored. The browser side is tested in Chromium, in
 * engine-checks/listener-hook-chromium.test.js.
 *
 * jsdom's own selector engine adds keydown and keyup listeners to the window
 * the first time a selector runs; each page here runs one before the hook is
 * installed, so they are not taken for the page's.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { listenerHookScript } = require('../../src/index.js');
const { readListenerHook, LISTENER_TYPES } = require('../../src/core/listener-hook.js');
const { runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

const KEY = Symbol.for('surea11y.listeners');

// A jsdom page with the hook installed (early unless said otherwise), then
// `script` run as the page's own.
function page(body, script, { hook = true, early = true } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { runScripts: 'outside-only' }
  );
  dom.window.document.querySelector('*');
  if (hook) dom.window.eval(listenerHookScript(early ? { early: true } : undefined));
  if (script) dom.window.eval(script);
  return dom;
}

function outcome(dom, ruleId) {
  const result = runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false });
  const rule = result.checksResults.find((c) => c.ruleId === ruleId);
  return {
    outcome: rule.outcome,
    codes: rule.occurrences.map((o) => o.data.details.reasonCode),
    occurrences: rule.occurrences,
    environment: result.engine.environment
  };
}

// A realm whose EventTarget's methods are stubs, recording their calls, and
// throwing `error` when given one.
function realm({ readyState = 'loading', error = null } = {}) {
  function EventTarget() {}
  const calls = [];
  const stub = (name) =>
    ({
      [name](...args) {
        calls.push({ name, self: this, args });
        if (error) throw error;
        return 'returned';
      }
    })[name];
  for (const name of ['addEventListener', 'removeEventListener']) {
    Object.defineProperty(EventTarget.prototype, name, {
      value: stub(name),
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  const global = { EventTarget, document: { readyState } };
  return { global, EventTarget, calls };
}

function install(global, options) {
  new Function('globalThis', listenerHookScript(options))(global);
}

test('the script parses, and holds nothing that evaluates text or ends an inline script', () => {
  for (const options of [undefined, { early: true }]) {
    const source = listenerHookScript(options);
    assert.doesNotThrow(() => new vm.Script(source));
    assert.doesNotMatch(source, /\beval\s*\(|new Function|<\/script/i);
  }
});

test('the wrappers keep the originals’ name, length and property attributes', () => {
  const dom = page('', '');
  const proto = dom.window.EventTarget.prototype;
  for (const name of ['addEventListener', 'removeEventListener']) {
    const d = Object.getOwnPropertyDescriptor(proto, name);
    assert.equal(d.value.name, name);
    assert.equal(d.value.length, 2);
    assert.equal(d.enumerable, true);
    assert.equal(d.writable, true);
    assert.equal(d.configurable, true);
  }
  const onclick = Object.getOwnPropertyDescriptor(dom.window.HTMLElement.prototype, 'onclick');
  assert.equal(typeof onclick.get, 'function');
  assert.equal(typeof onclick.set, 'function');
});

test('the wrappers call the originals with the same this and arguments, and return what they return', () => {
  const { global, EventTarget, calls } = realm();
  install(global);
  const target = new EventTarget();
  const listener = () => {};
  const options = { capture: true };
  assert.equal(target.addEventListener('click', listener, options), 'returned');
  assert.equal(target.removeEventListener('click', listener, options), 'returned');
  assert.deepEqual(
    calls.map((c) => [c.name, c.self === target, c.args]),
    [
      ['addEventListener', true, ['click', listener, options]],
      ['removeEventListener', true, ['click', listener, options]]
    ]
  );
});

test('an error the original throws reaches the caller unchanged, and nothing is recorded', () => {
  const error = new TypeError('refused');
  const { global, EventTarget } = realm({ error });
  install(global);
  const target = new EventTarget();
  assert.throws(
    () => target.addEventListener('click', () => {}),
    (e) => e === error
  );
  const hook = readListenerHook(global);
  assert.equal(hook.has(target, 'click'), false);
});

test('a listener the page adds still runs, and the page removes it with the same function', () => {
  const dom = page(
    '<button id="b">x</button>',
    `var hits = 0; var f = function () { hits++; };
     var b = document.getElementById('b');
     b.addEventListener('click', f); b.click();
     b.removeEventListener('click', f); b.click();
     window.hits = hits;`
  );
  assert.equal(dom.window.hits, 1);
});

test('the registry is frozen, hidden, fixed, and says whether it came early', () => {
  const { global } = realm({ readyState: 'loading' });
  install(global);
  const d = Object.getOwnPropertyDescriptor(global, KEY);
  assert.equal(d.enumerable, false);
  assert.equal(d.writable, false);
  assert.equal(d.configurable, false);
  assert.ok(Object.isFrozen(d.value));
  assert.equal(d.value.version, 1);
  assert.equal(d.value.early, true);

  const late = realm({ readyState: 'complete' });
  install(late.global);
  assert.equal(late.global[KEY].early, false);
  const forced = realm({ readyState: 'complete' });
  install(forced.global, { early: true });
  assert.equal(forced.global[KEY].early, true);
});

test('installing it twice wraps once', () => {
  const { global, EventTarget, calls } = realm();
  install(global);
  const wrapped = EventTarget.prototype.addEventListener;
  install(global);
  assert.equal(EventTarget.prototype.addEventListener, wrapped);
  new EventTarget().addEventListener('click', () => {});
  assert.equal(calls.length, 1);
});

test('without EventTarget, it does nothing and does not throw', () => {
  const global = {};
  assert.doesNotThrow(() => install(global));
  assert.equal(Object.getOwnPropertySymbols(global).length, 0);
});

test('it records the types the rules ask about, once per listener and phase, until removed', () => {
  const dom = page(
    '<div id="a"></div><div id="b"></div>',
    `var f = function () {}, g = { handleEvent: function () {} };
     var a = document.getElementById('a'), b = document.getElementById('b');
     a.addEventListener('click', f); a.addEventListener('click', f);
     a.addEventListener('keydown', f, true); a.addEventListener('keydown', f);
     a.removeEventListener('keydown', f);
     a.addEventListener('mouseover', g);
     a.addEventListener('scroll', f);
     b.addEventListener('keyup', f, { capture: true });
     b.removeEventListener('keyup', f, true);`
  );
  const hook = readListenerHook(dom.window);
  const a = dom.window.document.getElementById('a');
  const b = dom.window.document.getElementById('b');
  assert.equal(hook.early, true);
  assert.equal(hook.has(a, 'click'), true);
  assert.equal(hook.has(a, 'keydown'), true, 'the capture listener is still there');
  assert.equal(hook.has(a, 'mouseover'), true, 'an object with handleEvent counts');
  assert.equal(hook.has(a, 'scroll'), false, 'a type the rules do not ask about');
  assert.equal(hook.has(b, 'keyup'), false);
  assert.ok(LISTENER_TYPES.includes('click') && !LISTENER_TYPES.includes('scroll'));
});

test('an onclick-style property is a listener while it holds a function', () => {
  const dom = page(
    '<div id="a"></div><svg><rect id="r" /></svg>',
    `var a = document.getElementById('a');
     a.onclick = function () { window.clicked = true; };
     document.getElementById('r').onmousedown = function () {};
     document.onkeydown = function () {};
     a.click();`
  );
  const hook = readListenerHook(dom.window);
  const doc = dom.window.document;
  assert.equal(dom.window.clicked, true, 'the property still sets the handler');
  assert.equal(hook.has(doc.getElementById('a'), 'click'), true);
  assert.equal(hook.has(doc.getElementById('r'), 'mousedown'), true);
  assert.equal(hook.has(doc, 'keydown'), true);
  dom.window.eval("document.getElementById('a').onclick = null;");
  assert.equal(hook.has(doc.getElementById('a'), 'click'), false);
});

test('addEventListener called on its own adds to the window, as the DOM does', () => {
  const dom = page('', "addEventListener('keydown', function () {});");
  assert.equal(readListenerHook(dom.window).has(dom.window, 'keydown'), true);
});

test('the engine reads a registry only when it is shaped as the hook makes it', () => {
  const forged = (registry) => {
    const win = {};
    Object.defineProperty(win, KEY, { value: registry });
    return readListenerHook(win);
  };
  assert.equal(forged(null), null);
  assert.equal(forged({ version: 2, map: new WeakMap() }), null);
  assert.equal(forged({ version: 1, map: new Map() }), null);
  assert.equal(forged({ version: 1, map: { get() {} } }), null);
  const getter = {};
  Object.defineProperty(getter, 'version', {
    get() {
      throw new Error('ran a getter');
    }
  });
  assert.equal(forged(getter), null);
  assert.equal(readListenerHook(null), null);
  assert.equal(readListenerHook({}), null);
});

test('an early hook is late once the page replaces addEventListener', () => {
  const dom = page('', 'EventTarget.prototype.addEventListener = function () {};');
  assert.equal(readListenerHook(dom.window).early, false);
});

test('listenerHookScript refuses options it does not know', () => {
  assert.throws(() => listenerHookScript({ late: true }), /no option named "late"/);
  assert.throws(() => listenerHookScript({ early: 'yes' }), /early must be true or false/);
  assert.throws(() => listenerHookScript([]), /options must be an object/);
});

test('the result records the hook, early or late, and nothing without one', () => {
  assert.equal(
    outcome(page('', ''), 'click-handler-keyboard-operable').environment.listenerHook,
    'early'
  );
  assert.equal(
    outcome(page('', '', { hook: false }), 'click-handler-keyboard-operable').environment
      .listenerHook,
    undefined
  );
});

// ---------------------------------------------------------------------------
// click-handler-keyboard-operable
// ---------------------------------------------------------------------------

const BUTTON = '<div id="a" role="button" tabindex="0">Save</div>';
const a = "document.getElementById('a')";

test('click-handler: without the hook, a click listener added from script is not seen', () => {
  const dom = page(BUTTON, `${a}.addEventListener('click', function () {});`, { hook: false });
  assert.equal(outcome(dom, 'click-handler-keyboard-operable').outcome, 'notApplicable');
});

test('click-handler: a focusable control with a click listener and no key listener anywhere fails, with an early hook', () => {
  const dom = page(BUTTON, `${a}.addEventListener('click', function () {});`);
  const got = outcome(dom, 'click-handler-keyboard-operable');
  assert.deepEqual([got.outcome, got.codes], ['fail', ['CLICK_HANDLER_NO_KEY_LISTENER']]);
  assert.equal(got.occurrences[0].data.details.role, 'button');
});

test('click-handler: an onclick property counts as a click listener', () => {
  const dom = page(BUTTON, `${a}.onclick = function () {};`);
  assert.deepEqual(outcome(dom, 'click-handler-keyboard-operable').codes, [
    'CLICK_HANDLER_NO_KEY_LISTENER'
  ]);
});

test('click-handler: a key listener of its own passes', () => {
  for (const key of ['keydown', 'keyup', 'keypress']) {
    const dom = page(
      BUTTON,
      `${a}.addEventListener('click', function () {}); ${a}.addEventListener('${key}', function () {});`
    );
    assert.equal(outcome(dom, 'click-handler-keyboard-operable').outcome, 'pass', key);
  }
});

test('click-handler: a key listener only above the element is asked about, never passed or failed', () => {
  for (const where of ['document', 'window', "document.querySelector('main')", 'document.body']) {
    const dom = page(
      BUTTON,
      `${a}.addEventListener('click', function () {}); ${where}.addEventListener('keydown', function () {});`
    );
    const got = outcome(dom, 'click-handler-keyboard-operable');
    assert.deepEqual(
      [got.outcome, got.codes],
      ['cantTell', ['CLICK_HANDLER_KEY_LISTENER_ABOVE']],
      where
    );
  }
});

test('click-handler: a late hook may have missed listeners, so it never fails for lack of one', async () => {
  const dom = page(BUTTON, '', { hook: false });
  await new Promise((resolve) => dom.window.addEventListener('load', resolve));
  dom.window.eval(listenerHookScript());
  dom.window.eval(`${a}.addEventListener('click', function () {});`);
  const got = outcome(dom, 'click-handler-keyboard-operable');
  assert.equal(got.environment.listenerHook, 'late');
  assert.deepEqual([got.outcome, got.codes], ['cantTell', ['CLICK_HANDLER_NO_KEY_HANDLER']]);
});

test('click-handler: an element with no control role is asked about, not failed', () => {
  const dom = page(
    '<div id="a" tabindex="0">Save</div>',
    `${a}.addEventListener('click', function () {});`
  );
  assert.deepEqual(outcome(dom, 'click-handler-keyboard-operable').codes, [
    'CLICK_HANDLER_NO_KEY_HANDLER'
  ]);
});

test('click-handler: a control that cannot take focus fails as with an inline onclick', () => {
  const dom = page(
    '<div id="a" role="button">Save</div>',
    `${a}.addEventListener('click', function () {});`
  );
  assert.deepEqual(outcome(dom, 'click-handler-keyboard-operable').codes, [
    'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE'
  ]);
});

test('click-handler: a click listener on an ancestor is the ancestor’s, not its descendants’', () => {
  // The container is judged as one with an inline onclick is; the button in
  // it is no candidate, as nothing says the listener serves it.
  const dom = page(
    `<div id="root">${BUTTON}</div>`,
    "document.getElementById('root').addEventListener('click', function () {});"
  );
  const got = outcome(dom, 'click-handler-keyboard-operable');
  assert.deepEqual(
    got.occurrences.map((o) => o.selector),
    ['#root']
  );
  // A container whose content is a native control delegates to it.
  const native = page(
    '<div id="root"><button>Save</button></div>',
    "document.getElementById('root').addEventListener('click', function () {});"
  );
  assert.equal(outcome(native, 'click-handler-keyboard-operable').outcome, 'notApplicable');
});

test('click-handler: a removed click listener is no longer a candidate', () => {
  const dom = page(
    BUTTON,
    `var f = function () {}; ${a}.addEventListener('click', f); ${a}.removeEventListener('click', f);`
  );
  assert.equal(outcome(dom, 'click-handler-keyboard-operable').outcome, 'notApplicable');
});

test('click-handler: an inline onclick is judged with the hook’s key listeners too', () => {
  const dom = page(
    '<div id="a" role="button" tabindex="0" onclick="save()">Save</div>',
    `${a}.addEventListener('keydown', function () {});`
  );
  assert.equal(outcome(dom, 'click-handler-keyboard-operable').outcome, 'pass');
});

// ---------------------------------------------------------------------------
// mouse-only-event-handlers and widget-keyboard-focusable
// ---------------------------------------------------------------------------

test('mouse-only: a pointer listener added from script is asked about, named as its attribute', () => {
  const dom = page(
    '<span id="a">Tip</span>',
    `${a}.addEventListener('mouseover', function () {});`
  );
  const got = outcome(dom, 'mouse-only-event-handlers');
  assert.deepEqual(
    [got.outcome, got.codes],
    ['cantTell', ['MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT']]
  );
  assert.deepEqual(got.occurrences[0].data.details.mouseAttrs, ['onmouseover']);
});

test('mouse-only: a focus listener on a focusable element is the keyboard equivalent', () => {
  const dom = page(
    '<span id="a" tabindex="0">Tip</span>',
    `${a}.addEventListener('mouseenter', function () {}); ${a}.addEventListener('focus', function () {});`
  );
  assert.equal(outcome(dom, 'mouse-only-event-handlers').outcome, 'notApplicable');
});

test('mouse-only: a focusin listener counts for a focusable descendant', () => {
  const dom = page(
    '<div id="a"><button>Tip</button></div>',
    `${a}.addEventListener('mouseover', function () {}); ${a}.addEventListener('focusin', function () {});`
  );
  assert.equal(outcome(dom, 'mouse-only-event-handlers').outcome, 'notApplicable');
});

test('mouse-only: without the hook, a pointer listener added from script is not seen', () => {
  const dom = page(
    '<span id="a">Tip</span>',
    `${a}.addEventListener('mouseover', function () {});`,
    {
      hook: false
    }
  );
  assert.equal(outcome(dom, 'mouse-only-event-handlers').outcome, 'notApplicable');
});

test('widget-keyboard-focusable: a widget with a click listener is left to click-handler-keyboard-operable', () => {
  const body = '<div id="a" role="button">Save</div>';
  assert.deepEqual(outcome(page(body, '', { hook: false }), 'widget-keyboard-focusable').codes, [
    'WIDGET_NOT_FOCUSABLE'
  ]);
  const dom = page(body, `${a}.addEventListener('click', function () {});`);
  assert.equal(outcome(dom, 'widget-keyboard-focusable').outcome, 'notApplicable');
});
