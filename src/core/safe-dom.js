/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Reads DOM properties and calls DOM methods in a way a page's markup can't
 * redirect.
 *
 * HTML declares `HTMLFormElement` and `Document` with
 * `[LegacyOverrideBuiltIns]`: a form's named controls override the form's own
 * properties, and named images, forms, embeds, objects and iframes override
 * `document`'s. On `<form><input name="parentNode">`, `form.parentNode` is
 * that input, so a walk up the tree loops forever; on `<img
 * name="querySelectorAll">`, `document.querySelectorAll` is that image. The
 * overriding happens when the property is read on the object, not on its
 * prototypes, so each accessor here looks the property up on the object's
 * own prototype chain and applies what it finds there. What the object holds
 * itself is still read, as before, unless it is a named element: a wrapper a
 * script put on one element, or a test's stand-in, keeps working.
 *
 * Only forms, documents and windows can have their properties overridden
 * this way, so only they take that path. Every other object -- nearly every
 * read the engine makes -- is read the ordinary way after one cached check of
 * its prototype, so behaviour and cost there are as before.
 *
 * `dom.<getter>(node)` reads a property (`dom.parentNode(el)`);
 * `dom.<method>(node, ...args)` calls a method
 * (`dom.getAttribute(el, 'role')`); `dom.get(node, name)` reads any
 * property, a method included, without calling it; `dom.call(node, name,
 * ...args)` calls any method by name (`dom.call(walker, 'nextSibling')`).
 *
 * A DOM node without that property on its prototype chain reads it as
 * undefined -- what an unaltered page gives -- since reading it the ordinary
 * way would find the very named element. Anything else without it (a plain
 * object standing in for a node in a test, a value from another library) is
 * read the ordinary way, so the accessors are safe to use on any object.
 * Like the plain property access they replace, they throw on null and
 * undefined.
 *
 * The lookups don't depend on a window: they follow the node's own prototype
 * chain, so nodes from any realm (frames, jsdom windows) work, and one
 * instance serves the whole scan.
 */

const SAFE_DOM_GETTERS = [
  'activeElement',
  'assignedSlot',
  'attributes',
  'baseURI',
  'body',
  'childElementCount',
  'childNodes',
  'children',
  'contentDocument',
  'contentWindow',
  'defaultView',
  'doctype',
  'documentElement',
  'firstChild',
  'firstElementChild',
  'fonts',
  'head',
  'host',
  'isConnected',
  'lastChild',
  'lastElementChild',
  'localName',
  'namespaceURI',
  'nextElementSibling',
  'nextSibling',
  'nodeName',
  'nodeType',
  'nodeValue',
  'outerHTML',
  'ownerDocument',
  'parentElement',
  'parentNode',
  'previousElementSibling',
  'previousSibling',
  'readyState',
  'shadowRoot',
  'styleSheets',
  'tagName',
  'textContent',
  'timeline'
];

const SAFE_DOM_METHODS = [
  'addEventListener',
  'appendChild',
  'assignedElements',
  'assignedNodes',
  'blur',
  'checkVisibility',
  'cloneNode',
  'closest',
  'compareDocumentPosition',
  'contains',
  'createElement',
  'createRange',
  'createTreeWalker',
  'elementFromPoint',
  'elementsFromPoint',
  'focus',
  'getAnimations',
  'getAttribute',
  'getAttributeNames',
  'getBoundingClientRect',
  'getClientRects',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'getRootNode',
  'getScreenCTM',
  'hasAttribute',
  'hasChildNodes',
  'insertBefore',
  'matches',
  'querySelector',
  'querySelectorAll',
  'removeAttribute',
  'removeChild',
  'removeEventListener',
  'setAttribute'
];

// Names the engine reads through dom.get or dom.call that aren't DOM-only
// (also properties of ordinary objects). tests/core/safe-dom.test.js checks
// that every name the source passes to dom.get or dom.call is listed here or
// above, since the page check below relies on it.
const SAFE_DOM_OTHER_NAMES = [
  'adoptedStyleSheets',
  'clientHeight',
  'clientWidth',
  'id',
  'selected',
  'src',
  'style',
  'title',
  'type',
  'value'
];

function createSafeDom() {
  // One instance per realm of this script: the lookups depend only on the
  // prototypes they are given, so sharing it across scans is safe.
  if (createSafeDom.__instance) return createSafeDom.__instance;

  // Captured once, so a page that later replaces them doesn't change how
  // the engine reads its own DOM.
  const getProto = Object.getPrototypeOf;
  const getOwnDesc = Object.getOwnPropertyDescriptor;
  const apply = Reflect.apply;
  const objectHasOwn = Object.prototype.hasOwnProperty;
  const hasOwn =
    typeof Object.hasOwn === 'function'
      ? Object.hasOwn
      : (obj, name) => apply(objectHasOwn, obj, [name]);

  // What a prototype chain defines for a name: its getter, its method, or
  // nothing -- and then whether the chain is a DOM node's, which reads a
  // name it doesn't define as undefined (an ordinary read would reach a named
  // element), unlike any other object, which is read the ordinary way.
  const NONE = Object.freeze({ getter: null, value: undefined, node: false });
  const NONE_NODE = Object.freeze({ getter: null, value: undefined, node: true });

  // Only an accessor or a function counts: a named-properties object
  // (Window's, which holds `window.<id>` entries) has plain data properties
  // for named elements, and those must be passed over to reach the real
  // method further up.
  function findOnChain(proto, name) {
    for (let p = proto; p; p = getProto(p)) {
      const d = getOwnDesc(p, name);
      if (d && typeof d.get === 'function') return { getter: d.get, value: undefined, node: false };
      if (d && typeof d.value === 'function') return { getter: null, value: d.value, node: false };
    }
    return null;
  }

  function isNodeChain(proto) {
    const found = proto ? findOnChain(proto, 'nodeType') : null;
    return !!(found && found.getter);
  }

  // Whether `v` is what a named element puts in place of a property: an
  // element, a collection of them (two controls sharing a name), or a
  // window (an iframe's name).
  function isNamedElementValue(v) {
    if (v === null || (typeof v !== 'object' && typeof v !== 'function')) return false;
    const proto = getProto(v);
    if (!proto) return false;
    if (isNodeChain(proto)) return true;
    const item = findOnChain(proto, 'item');
    if (item && item.value && findOnChain(proto, 'length')) return true;
    try {
      return v.window === v;
    } catch {
      return true;
    }
  }

  // Whether objects with this prototype can have properties overridden by
  // named elements: a form (HTMLFormElement), a document (Document) or a
  // window (whose named-properties object sits in its chain). Every other
  // object is read the ordinary way. Recognised by what their prototypes
  // define, so it works for any realm.
  // 0: not guarded; FORM: a form; OWNER: a document or a window, where a
  // script or a test may have put its own wrapper on the object itself.
  const FORM = 1;
  const OWNER = 2;
  const guardedByProto = new WeakMap();
  function guardOf(proto) {
    let g = guardedByProto.get(proto);
    if (g !== undefined) return g;
    g = 0;
    for (let p = proto; p && !g; p = getProto(p)) {
      if (getOwnDesc(p, 'acceptCharset'))
        g = FORM; // HTMLFormElement.prototype
      else if (getOwnDesc(p, 'documentElement') || getOwnDesc(p, 'getComputedStyle')) {
        g = OWNER; // Document.prototype, Window.prototype
      }
    }
    guardedByProto.set(proto, g);
    return g;
  }

  // What the prototype chain defines for each name, per prototype: read on a
  // form, a document or a window.
  const byName = new Map();
  function protectedGet(obj, name) {
    const proto = getProto(obj);
    // On a document or a window, a property the object holds itself (a
    // wrapper a script put on it, a test's stand-in) is honoured, as an
    // ordinary read would, unless it is a named element. Forms are not
    // checked: asking a form for its own properties means searching its
    // named controls, which is slow, and scripts don't wrap form methods.
    if (guardOf(proto) === OWNER && hasOwn(obj, name)) {
      let d;
      try {
        d = getOwnDesc(obj, name);
      } catch {
        d = null;
      }
      if (d && !('value' in d && isNamedElementValue(d.value))) {
        return d.get ? apply(d.get, obj, []) : d.value;
      }
    }
    let byProto = byName.get(name);
    if (!byProto) {
      byProto = new WeakMap();
      byName.set(name, byProto);
    }
    let entry = byProto.get(proto);
    if (!entry) {
      entry = findOnChain(proto, name) || (isNodeChain(proto) ? NONE_NODE : NONE);
      byProto.set(proto, entry);
    }
    if (entry.getter) return apply(entry.getter, obj, []);
    if (entry.value) return entry.value;
    return entry.node ? undefined : obj[name];
  }
  function protectedCall(obj, name, ...args) {
    return apply(protectedGet(obj, name), obj, args);
  }

  // Whether the page being scanned can override properties at all. Only an
  // element whose id or name is the name of a DOM property can (a form's
  // controls, document's and window's named elements), so a scan checks the
  // page once at its start (protectFor) and, on the nearly every page where
  // no such element exists, the accessors are the plain reads they replace.
  // Outside a scan, and whenever the check can't tell, they protect.
  let protect = true;

  // The names a named element could override and the engine would then
  // read wrongly: on a form or a document, every name the accessors read; on
  // a window, the EventTarget methods (the only ones a window's named
  // elements can reach, sitting below its own prototype).
  const READ_NAMES = new Set([...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS, ...SAFE_DOM_OTHER_NAMES]);
  const WINDOW_NAMES = new Set(['addEventListener', 'removeEventListener', 'dispatchEvent']);
  // The elements a name or id of which names a property of their form (the
  // listed elements, images, and form-associated custom elements) or of the
  // document (embeds, forms, iframes, images, objects).
  const NAMED_TAGS = new Set([
    'button',
    'embed',
    'fieldset',
    'form',
    'iframe',
    'img',
    'input',
    'object',
    'output',
    'select',
    'textarea'
  ]);

  // Whether an element in `doc`, or in an open shadow root inside it, has an
  // id or name that would override something the engine reads. Reads
  // through the protected path throughout, since the page may be one that
  // overrides.
  function pageCanOverride(doc) {
    const docEl = protectedGet(doc, 'documentElement');
    if (!docEl) return false;
    // The element methods and getters, found once on the root element's
    // prototype chain and applied to every element: they are Element's, so
    // they work on any element, and resolving them per element would cost
    // more than the check itself on a small page.
    const elProto = getProto(docEl);
    const found = (name) => findOnChain(elProto, name) || {};
    const getAttribute = found('getAttribute').value;
    const localName = found('localName').getter;
    const shadowRoot = found('shadowRoot').getter;
    if (!getAttribute || !localName) return true;
    const roots = [doc];
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      for (const el of protectedCall(root, 'querySelectorAll', '[id], [name]')) {
        const id = apply(getAttribute, el, ['id']);
        const name = apply(getAttribute, el, ['name']);
        if ((id !== null && WINDOW_NAMES.has(id)) || (name !== null && WINDOW_NAMES.has(name))) {
          return true;
        }
        const tag = String(apply(localName, el, []) || '');
        if (!NAMED_TAGS.has(tag) && tag.indexOf('-') === -1) continue;
        if ((id !== null && READ_NAMES.has(id)) || (name !== null && READ_NAMES.has(name))) {
          return true;
        }
      }
      if (!shadowRoot) continue;
      const walker = protectedCall(doc, 'createTreeWalker', root === doc ? docEl : root, 1);
      for (let el = walker.currentNode; el; el = walker.nextNode()) {
        if (el === root) continue;
        const shadow = apply(shadowRoot, el, []);
        if (shadow) roots.push(shadow);
      }
    }
    return false;
  }

  // Sets the accessors for a scan of `doc`, and returns what puts them back.
  function protectFor(doc) {
    const before = protect;
    let can;
    try {
      can = !doc || pageCanOverride(doc);
    } catch {
      can = true;
    }
    protect = can;
    return () => {
      protect = before;
    };
  }

  // Whether `obj` needs the protected read, remembering the last prototype
  // seen: loops over the DOM meet the same few prototypes over and over.
  // Object.getPrototypeOf throws on null and undefined, as reading a property
  // of them does.
  let lastProto;
  let lastGuard = 0;
  function guard(obj) {
    const proto = getProto(obj);
    if (proto !== lastProto) {
      lastProto = proto;
      lastGuard = proto === null ? 0 : guardOf(proto);
    }
    return lastGuard;
  }

  // One accessor per name, written out with the name in the source rather
  // than looked up by a variable, so the engine running this code can
  // optimise each one, and inline it where it is called, as it would the
  // plain read it replaces. On an object no named element can affect, it is
  // that plain read. Methods pass four arguments through: the DOM methods
  // here take at most three, and an argument passed as undefined is the same
  // to them as one left out. tests/core/safe-dom.test.js checks this list
  // against SAFE_DOM_GETTERS and SAFE_DOM_METHODS.
  const dom = {
    get: (o, name) => (protect && guard(o) ? protectedGet(o, name) : o[name]),
    call: (o, name, ...args) =>
      protect && guard(o) ? protectedCall(o, name, ...args) : apply(o[name], o, args),
    protectFor,
    activeElement: (o) =>
      protect && guard(o) ? protectedGet(o, 'activeElement') : o.activeElement,
    assignedSlot: (o) => (protect && guard(o) ? protectedGet(o, 'assignedSlot') : o.assignedSlot),
    attributes: (o) => (protect && guard(o) ? protectedGet(o, 'attributes') : o.attributes),
    baseURI: (o) => (protect && guard(o) ? protectedGet(o, 'baseURI') : o.baseURI),
    body: (o) => (protect && guard(o) ? protectedGet(o, 'body') : o.body),
    childElementCount: (o) =>
      protect && guard(o) ? protectedGet(o, 'childElementCount') : o.childElementCount,
    childNodes: (o) => (protect && guard(o) ? protectedGet(o, 'childNodes') : o.childNodes),
    children: (o) => (protect && guard(o) ? protectedGet(o, 'children') : o.children),
    contentDocument: (o) =>
      protect && guard(o) ? protectedGet(o, 'contentDocument') : o.contentDocument,
    contentWindow: (o) =>
      protect && guard(o) ? protectedGet(o, 'contentWindow') : o.contentWindow,
    defaultView: (o) => (protect && guard(o) ? protectedGet(o, 'defaultView') : o.defaultView),
    doctype: (o) => (protect && guard(o) ? protectedGet(o, 'doctype') : o.doctype),
    documentElement: (o) =>
      protect && guard(o) ? protectedGet(o, 'documentElement') : o.documentElement,
    firstChild: (o) => (protect && guard(o) ? protectedGet(o, 'firstChild') : o.firstChild),
    firstElementChild: (o) =>
      protect && guard(o) ? protectedGet(o, 'firstElementChild') : o.firstElementChild,
    fonts: (o) => (protect && guard(o) ? protectedGet(o, 'fonts') : o.fonts),
    head: (o) => (protect && guard(o) ? protectedGet(o, 'head') : o.head),
    host: (o) => (protect && guard(o) ? protectedGet(o, 'host') : o.host),
    isConnected: (o) => (protect && guard(o) ? protectedGet(o, 'isConnected') : o.isConnected),
    lastChild: (o) => (protect && guard(o) ? protectedGet(o, 'lastChild') : o.lastChild),
    lastElementChild: (o) =>
      protect && guard(o) ? protectedGet(o, 'lastElementChild') : o.lastElementChild,
    localName: (o) => (protect && guard(o) ? protectedGet(o, 'localName') : o.localName),
    namespaceURI: (o) => (protect && guard(o) ? protectedGet(o, 'namespaceURI') : o.namespaceURI),
    nextElementSibling: (o) =>
      protect && guard(o) ? protectedGet(o, 'nextElementSibling') : o.nextElementSibling,
    nextSibling: (o) => (protect && guard(o) ? protectedGet(o, 'nextSibling') : o.nextSibling),
    nodeName: (o) => (protect && guard(o) ? protectedGet(o, 'nodeName') : o.nodeName),
    nodeType: (o) => (protect && guard(o) ? protectedGet(o, 'nodeType') : o.nodeType),
    nodeValue: (o) => (protect && guard(o) ? protectedGet(o, 'nodeValue') : o.nodeValue),
    outerHTML: (o) => (protect && guard(o) ? protectedGet(o, 'outerHTML') : o.outerHTML),
    ownerDocument: (o) =>
      protect && guard(o) ? protectedGet(o, 'ownerDocument') : o.ownerDocument,
    parentElement: (o) =>
      protect && guard(o) ? protectedGet(o, 'parentElement') : o.parentElement,
    parentNode: (o) => (protect && guard(o) ? protectedGet(o, 'parentNode') : o.parentNode),
    previousElementSibling: (o) =>
      protect && guard(o) ? protectedGet(o, 'previousElementSibling') : o.previousElementSibling,
    previousSibling: (o) =>
      protect && guard(o) ? protectedGet(o, 'previousSibling') : o.previousSibling,
    readyState: (o) => (protect && guard(o) ? protectedGet(o, 'readyState') : o.readyState),
    // A custom element can override shadowRoot with a getter that throws;
    // its shadow tree is then unreadable, as a closed one is, rather than
    // an error in every rule that walks the tree.
    shadowRoot: (o) => {
      try {
        return protect && guard(o) ? protectedGet(o, 'shadowRoot') : o.shadowRoot;
      } catch {
        return null;
      }
    },
    styleSheets: (o) => (protect && guard(o) ? protectedGet(o, 'styleSheets') : o.styleSheets),
    tagName: (o) => (protect && guard(o) ? protectedGet(o, 'tagName') : o.tagName),
    textContent: (o) => (protect && guard(o) ? protectedGet(o, 'textContent') : o.textContent),
    timeline: (o) => (protect && guard(o) ? protectedGet(o, 'timeline') : o.timeline),
    addEventListener: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'addEventListener', a, b, c, d)
        : o.addEventListener(a, b, c, d),
    appendChild: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'appendChild', a, b, c, d) : o.appendChild(a, b, c, d),
    assignedElements: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'assignedElements', a, b, c, d)
        : o.assignedElements(a, b, c, d),
    assignedNodes: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'assignedNodes', a, b, c, d)
        : o.assignedNodes(a, b, c, d),
    blur: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'blur', a, b, c, d) : o.blur(a, b, c, d),
    checkVisibility: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'checkVisibility', a, b, c, d)
        : o.checkVisibility(a, b, c, d),
    cloneNode: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'cloneNode', a, b, c, d) : o.cloneNode(a, b, c, d),
    closest: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'closest', a, b, c, d) : o.closest(a, b, c, d),
    compareDocumentPosition: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'compareDocumentPosition', a, b, c, d)
        : o.compareDocumentPosition(a, b, c, d),
    contains: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'contains', a, b, c, d) : o.contains(a, b, c, d),
    createElement: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'createElement', a, b, c, d)
        : o.createElement(a, b, c, d),
    createRange: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'createRange', a, b, c, d) : o.createRange(a, b, c, d),
    createTreeWalker: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'createTreeWalker', a, b, c, d)
        : o.createTreeWalker(a, b, c, d),
    elementFromPoint: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'elementFromPoint', a, b, c, d)
        : o.elementFromPoint(a, b, c, d),
    elementsFromPoint: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'elementsFromPoint', a, b, c, d)
        : o.elementsFromPoint(a, b, c, d),
    focus: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'focus', a, b, c, d) : o.focus(a, b, c, d),
    getAnimations: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'getAnimations', a, b, c, d)
        : o.getAnimations(a, b, c, d),
    getAttribute: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'getAttribute', a, b, c, d)
        : o.getAttribute(a, b, c, d),
    getAttributeNames: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'getAttributeNames', a, b, c, d)
        : o.getAttributeNames(a, b, c, d),
    getBoundingClientRect: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'getBoundingClientRect', a, b, c, d)
        : o.getBoundingClientRect(a, b, c, d),
    getClientRects: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'getClientRects', a, b, c, d)
        : o.getClientRects(a, b, c, d),
    getElementById: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'getElementById', a, b, c, d)
        : o.getElementById(a, b, c, d),
    getElementsByClassName: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'getElementsByClassName', a, b, c, d)
        : o.getElementsByClassName(a, b, c, d),
    getElementsByTagName: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'getElementsByTagName', a, b, c, d)
        : o.getElementsByTagName(a, b, c, d),
    getRootNode: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'getRootNode', a, b, c, d) : o.getRootNode(a, b, c, d),
    getScreenCTM: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'getScreenCTM', a, b, c, d)
        : o.getScreenCTM(a, b, c, d),
    hasAttribute: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'hasAttribute', a, b, c, d)
        : o.hasAttribute(a, b, c, d),
    hasChildNodes: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'hasChildNodes', a, b, c, d)
        : o.hasChildNodes(a, b, c, d),
    insertBefore: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'insertBefore', a, b, c, d)
        : o.insertBefore(a, b, c, d),
    matches: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'matches', a, b, c, d) : o.matches(a, b, c, d),
    querySelector: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'querySelector', a, b, c, d)
        : o.querySelector(a, b, c, d),
    querySelectorAll: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'querySelectorAll', a, b, c, d)
        : o.querySelectorAll(a, b, c, d),
    removeAttribute: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'removeAttribute', a, b, c, d)
        : o.removeAttribute(a, b, c, d),
    removeChild: (o, a, b, c, d) =>
      protect && guard(o) ? protectedCall(o, 'removeChild', a, b, c, d) : o.removeChild(a, b, c, d),
    removeEventListener: (o, a, b, c, d) =>
      guard(o)
        ? protectedCall(o, 'removeEventListener', a, b, c, d)
        : o.removeEventListener(a, b, c, d),
    setAttribute: (o, a, b, c, d) =>
      protect && guard(o)
        ? protectedCall(o, 'setAttribute', a, b, c, d)
        : o.setAttribute(a, b, c, d)
  };

  createSafeDom.__instance = Object.freeze(dom);
  return createSafeDom.__instance;
}

module.exports = { createSafeDom, SAFE_DOM_GETTERS, SAFE_DOM_METHODS, SAFE_DOM_OTHER_NAMES };
