/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// Evidence states: a state a rule put the page in to find what it reports,
// such as the WCAG 1.4.12 text spacing, so a tool can put the page in it
// again to show the finding. A rule measures in one synchronous task, so
// the browser never paints the state, and a screenshot taken after the scan
// shows the page as it is, where the finding doesn't show. A finding made in
// a state names it in `data.details.evidenceState`.
//
// evidenceState(request) puts a page in a state and takes it out again, for
// a binding's screenshots. It is self-contained, as runa11yCoreInPage is:
// `evidenceState.toString()` evaluated in a page works there, so a driver
// sends it into a page with its evaluate. Requests:
//
// - `{ op: 'apply', state, token }`: puts the page in `state`. Returns
//   `{ applied: true, via }`, or `{ applied: false, reason }`: `unknown-state`
//   for a state it doesn't know, `blocked` where the page kept the state
//   from applying (a Content Security Policy that blocks styles and a
//   browser without constructed style sheets), `no-document` outside a page.
//   A token already in use is released first.
// - `{ op: 'release', token }`: takes the page out of the state applied
//   with `token`, and puts its scroll position back. Returns
//   `{ released: true }`, or `{ released: false }` for a token it doesn't
//   hold. It never throws, and removes what it added even when the page's
//   own code breaks one way of removing it.
//
// Throws a TypeError for a request it can't read. What a state applies is
// what its rule applies: a test (tests/core/evidence-state.test.js) checks
// the text spacing against text-spacing-content-loss's own.

/**
 * @param {{ op: 'apply'|'release', state?: string, token: string }} request
 * @returns {{ applied: boolean, via?: string, reason?: string }|{ released: boolean }}
 */
function evidenceState(request) {
  const KEY = Symbol.for('surea11y.evidenceStates');
  // Each state: the style sheet that makes it, in a cascade layer declared
  // before every other style, so its `!important` declarations win over the
  // page's own, as a user style sheet's would.
  const STATES = {
    'text-spacing': {
      layer: 'surea11y-text-spacing',
      css:
        '@layer surea11y-text-spacing {' +
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
        'p { margin-bottom: 2em !important; }' +
        '}'
    }
  };

  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError(
      "evidenceState(request): request must be an object, such as { op: 'apply', state: 'text-spacing', token }."
    );
  }
  const { op, state, token } = request;
  if (op !== 'apply' && op !== 'release') {
    throw new TypeError(
      `evidenceState(request): op must be "apply" or "release", not ${JSON.stringify(op)}.`
    );
  }
  if (typeof token !== 'string' || !token) {
    throw new TypeError('evidenceState(request): token must be a non-empty string.');
  }
  if (op === 'apply' && typeof state !== 'string') {
    throw new TypeError('evidenceState(request): apply needs the state, as a string.');
  }

  const win = typeof window === 'object' && window ? window : null;
  const doc = win && win.document ? win.document : null;

  // The DOM is used through the window's own prototypes, so a page that
  // shadows a method by name, or replaces it, changes nothing here.
  function call(proto, name, target, args) {
    try {
      const fn = proto && Object.getOwnPropertyDescriptor(proto, name);
      const f = fn && (typeof fn.value === 'function' ? fn.value : fn.get);
      if (typeof f === 'function') return Reflect.apply(f, target, args || []);
    } catch {}
    return undefined;
  }
  const NodeProto = win && win.Node ? win.Node.prototype : null;
  const DocProto = win && win.Document ? win.Document.prototype : null;
  const ElementProto = win && win.Element ? win.Element.prototype : null;

  function held() {
    if (!Object.prototype.hasOwnProperty.call(win, KEY)) {
      Object.defineProperty(win, KEY, { value: new Map(), configurable: true });
    }
    return win[KEY];
  }

  function release(tok) {
    if (!win || !Object.prototype.hasOwnProperty.call(win, KEY)) return { released: false };
    const entry = win[KEY].get(tok);
    if (!entry) return { released: false };
    win[KEY].delete(tok);
    const { sheet, adopted, scroll } = entry;
    if (sheet) {
      try {
        const parent = call(NodeProto, 'parentNode', sheet);
        if (parent) call(NodeProto, 'removeChild', parent, [sheet]);
      } catch {}
      try {
        if (call(NodeProto, 'parentNode', sheet)) sheet.remove();
      } catch {}
      try {
        if (call(NodeProto, 'parentNode', sheet)) sheet.textContent = '';
      } catch {}
    }
    if (adopted) {
      try {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== adopted);
      } catch {}
    }
    try {
      win.scrollTo(scroll[0], scroll[1]);
    } catch {}
    return { released: true };
  }

  if (op === 'release') return release(token);

  const spec = Object.prototype.hasOwnProperty.call(STATES, state) ? STATES[state] : null;
  if (!spec) return { applied: false, reason: 'unknown-state' };
  if (!doc) return { applied: false, reason: 'no-document' };
  release(token);

  const scroll = [win.scrollX || 0, win.scrollY || 0];
  const entry = { sheet: null, adopted: null, scroll };
  held().set(token, entry);

  // A <style> first in <head>, as the rule adds it; where a Content Security
  // Policy keeps it from applying (the browser gives it no style sheet), a
  // style sheet the document adopts.
  const sheet = call(DocProto, 'createElement', doc, ['style']);
  if (sheet) {
    call(ElementProto, 'setAttribute', sheet, ['data-surea11y', spec.layer]);
    sheet.textContent = spec.css;
    const head = call(DocProto, 'head', doc) || call(DocProto, 'documentElement', doc);
    if (head) {
      call(NodeProto, 'insertBefore', head, [sheet, call(NodeProto, 'firstChild', head) || null]);
      entry.sheet = sheet;
      if (sheet.sheet) return { applied: true, via: 'style' };
      // Blocked: taken out again before the style sheet is adopted.
      const parent = call(NodeProto, 'parentNode', sheet);
      if (parent) call(NodeProto, 'removeChild', parent, [sheet]);
      if (!call(NodeProto, 'parentNode', sheet)) entry.sheet = null;
    }
  }
  try {
    const Sheet = win.CSSStyleSheet;
    if (typeof Sheet === 'function' && Array.isArray(doc.adoptedStyleSheets)) {
      const adopted = new Sheet();
      adopted.replaceSync(spec.css);
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.concat([adopted]);
      entry.adopted = adopted;
      return { applied: true, via: 'adopted' };
    }
  } catch {}
  release(token);
  return { applied: false, reason: 'blocked' };
}

// The states evidenceState knows.
const EVIDENCE_STATES = Object.freeze(['text-spacing']);

module.exports = { evidenceState, EVIDENCE_STATES };
