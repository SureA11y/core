'use strict';

/**
 * The safe DOM accessors (src/core/safe-dom.js) read what the browser
 * defines, whatever the object itself says (#90).
 *
 * In a browser, a form's named controls and document's named images
 * override properties on the object itself. jsdom doesn't do that, so these
 * tests stand in for it with an own property on the node, which shadows the
 * prototype the same way. The real thing is tested in Chromium in
 * tests/engine-checks/named-property-override-chromium.test.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createSafeDom, SAFE_DOM_GETTERS, SAFE_DOM_METHODS } = require('../../src/core/safe-dom');

const dom = createSafeDom();

function page(html) {
  return new JSDOM(`<!doctype html><html><head><title>T</title></head><body>${html}</body></html>`)
    .window.document;
}

// What a named control or image does to `obj.name`, as an own property.
function override(obj, name, value) {
  Object.defineProperty(obj, name, { value, configurable: true });
}

test('a getter reads the prototype, not a property the object has itself', () => {
  const doc = page('<main><form><input name="x"></form></main>');
  const form = doc.querySelector('form');
  const input = doc.querySelector('input');
  override(form, 'parentNode', input);
  override(form, 'parentElement', input);
  override(form, 'nodeType', input);
  override(form, 'tagName', input);
  assert.equal(dom.parentNode(form), doc.querySelector('main'));
  assert.equal(dom.parentElement(form), doc.querySelector('main'));
  assert.equal(dom.nodeType(form), 1);
  assert.equal(dom.tagName(form), 'FORM');
});

test('a method is the prototype one, called on the object', () => {
  const doc = page('<form aria-label="Search"><input name="x"></form>');
  const form = doc.querySelector('form');
  const input = doc.querySelector('input');
  override(form, 'getAttribute', input);
  override(form, 'querySelectorAll', input);
  override(form, 'closest', input);
  assert.equal(dom.getAttribute(form, 'aria-label'), 'Search');
  assert.equal(dom.hasAttribute(form, 'aria-label'), true);
  assert.equal(dom.querySelectorAll(form, 'input').length, 1);
  assert.equal(dom.closest(form, 'body'), doc.body);
});

test('document reads go to the document, not to a named image', () => {
  const doc = page('<img name="documentElement">');
  const img = doc.querySelector('img');
  override(doc, 'documentElement', img);
  override(doc, 'querySelectorAll', img);
  override(doc, 'body', img);
  assert.equal(dom.documentElement(doc).tagName, 'HTML');
  assert.equal(dom.body(doc).tagName, 'BODY');
  assert.equal(dom.querySelectorAll(doc, 'img').length, 1);
  assert.equal(dom.get(doc, 'title'), 'T');
});

test('a name a node does not define reads as undefined, not as what overrides it', () => {
  const doc = page('<form><input name="host"></form>');
  const form = doc.querySelector('form');
  const input = doc.querySelector('input');
  override(form, 'host', input);
  override(doc, 'assignedSlot', input);
  assert.equal(dom.get(form, 'host'), undefined);
  assert.equal(dom.host(form), undefined);
  assert.equal(dom.assignedSlot(doc), undefined);
  assert.throws(() => dom.call(form, 'noSuchMethod'), TypeError);
});

test('dom.get returns a method without calling it, as a plain read does', () => {
  const doc = page('<p>x</p>');
  const p = doc.querySelector('p');
  assert.equal(typeof dom.get(p, 'closest'), 'function');
  assert.equal(dom.get(p, 'closest'), p.closest);
});

test('dom.call reaches methods that share a getter name on other interfaces', () => {
  const doc = page('<div><p>a</p><p>b</p></div>');
  const walker = doc.createTreeWalker(doc.querySelector('div'), 1);
  assert.equal(dom.call(walker, 'firstChild').textContent, 'a');
  assert.equal(dom.call(walker, 'nextSibling').textContent, 'b');
  // As a getter on a node, the same name is a property.
  assert.equal(dom.nextSibling(doc.querySelector('p')).textContent, 'b');
});

test('anything that is not a DOM node is read the ordinary way', () => {
  const stand = {
    parentNode: 'parent',
    getAttribute: (n) => `attr:${n}`,
    title: 'plain'
  };
  assert.equal(dom.parentNode(stand), 'parent');
  assert.equal(dom.getAttribute(stand, 'role'), 'attr:role');
  assert.equal(dom.get(stand, 'title'), 'plain');
  assert.equal(dom.get(Object.create(null), 'x'), undefined);
  assert.equal(dom.host(new URL('https://example.test:8080/a')), 'example.test:8080');
});

test('null and undefined throw, as reading a property of them does', () => {
  assert.throws(() => dom.parentNode(null), TypeError);
  assert.throws(() => dom.getAttribute(undefined, 'x'), TypeError);
});

test('every listed name is an accessor or a method on some DOM interface', () => {
  const { window } = new JSDOM('');
  const protos = [
    window.Node,
    window.Element,
    window.HTMLElement,
    window.Document,
    window.DocumentFragment,
    window.ShadowRoot,
    window.HTMLSlotElement,
    window.HTMLIFrameElement,
    window.EventTarget,
    window.Range
  ]
    .filter(Boolean)
    .map((c) => c.prototype);
  const has = (name) =>
    protos.some((p) => {
      for (let q = p; q; q = Object.getPrototypeOf(q)) {
        if (Object.getOwnPropertyDescriptor(q, name)) return true;
      }
      return false;
    });
  // jsdom lacks a few browser-only members; those are listed with what
  // provides them in a browser.
  const browserOnly = new Set([
    'checkVisibility',
    'elementFromPoint',
    'elementsFromPoint',
    'fonts',
    'timeline',
    'getAnimations'
  ]);
  for (const name of [...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS]) {
    if (browserOnly.has(name)) continue;
    assert.ok(has(name), `${name} is not on a DOM prototype`);
  }
});

test('one instance serves every caller', () => {
  assert.equal(createSafeDom(), dom);
  assert.ok(Object.isFrozen(dom));
});

test('there is one accessor for every listed name, and no other', () => {
  const names = Object.keys(dom)
    .filter((k) => k !== 'get' && k !== 'call' && k !== 'protectFor')
    .sort();
  assert.deepEqual(names, [...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS].sort());
  for (const name of SAFE_DOM_METHODS) assert.equal(dom[name].length, 5, name);
  for (const name of SAFE_DOM_GETTERS) assert.equal(dom[name].length, 1, name);
});

test('every name the engine reads through dom.get or dom.call is listed', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { SAFE_DOM_OTHER_NAMES } = require('../../src/core/safe-dom');
  const listed = new Set([...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS, ...SAFE_DOM_OTHER_NAMES]);
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.js') && full !== path.join(__dirname, '../../src/core.js'))
        files.push(full);
    }
  };
  walk(path.join(__dirname, '../../src/core'));
  walk(path.join(__dirname, '../../src/checks'));
  const unlisted = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/dom\.(?:get|call)\([^,()]+(?:\([^()]*\))?, '([A-Za-z]+)'/g)) {
      if (!listed.has(m[1])) unlisted.add(`${m[1]} (${path.basename(f)})`);
    }
  }
  assert.deepEqual([...unlisted], []);
});

test('a scan protects only a page that has an element named after something the engine reads', () => {
  const cases = [
    ['<p>plain</p>', false],
    [
      '<div id="title"></div><input name="email"><form id="content"><input name="name"></form>',
      false
    ],
    ['<form><input name="parentNode"></form>', true],
    ['<form><input name="title"></form>', true],
    ['<img name="querySelectorAll" alt="">', true],
    ['<div id="addEventListener"></div>', true],
    ['<div id="parentNode"></div>', false]
  ];
  for (const [html, protects] of cases) {
    const doc = page(`<main>${html}</main>`);
    const form = doc.createElement('form');
    doc.querySelector('main').appendChild(form);
    override(form, 'parentNode', null);
    const restore = dom.protectFor(doc);
    try {
      // Protected, the form's real parent is read; not, its own property is.
      assert.equal(dom.parentNode(form) !== null, protects, html);
    } finally {
      restore();
    }
  }
  // Outside a scan the accessors protect.
  const doc = page('<form></form>');
  const form = doc.querySelector('form');
  override(form, 'parentNode', null);
  assert.equal(dom.parentNode(form), doc.body);
});

test('the page check looks inside open shadow roots', () => {
  const doc = page('<div id="host"></div>');
  doc.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
    '<form><input name="getAttribute"></form>';
  const form = doc.createElement('form');
  doc.body.appendChild(form);
  override(form, 'parentNode', null);
  const restore = dom.protectFor(doc);
  try {
    assert.equal(dom.parentNode(form), doc.body);
  } finally {
    restore();
  }
});
