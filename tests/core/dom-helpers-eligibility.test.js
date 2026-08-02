'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

function helpersFor(html, opts) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  const helpers = createDomHelpers(Object.assign({ window, document, root: document }, opts));
  return { helpers, document, window };
}

function byId(document, id) {
  return document.getElementById(id);
}

// ===== isAccTreeEligible =====

test('isAccTreeEligible: [hidden] attribute on an ancestor blocks the whole subtree', () => {
  const { helpers, document } = helpersFor('<div hidden><span id="s">x</span></div>');
  const r = helpers.isAccTreeEligible(byId(document, 's'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['hiddenAttr']);
});

test('isAccTreeEligible: a <template> element itself is never eligible (its content lives in a detached DocumentFragment)', () => {
  const { helpers, document } = helpersFor('<template id="t"><span>x</span></template>');
  const r = helpers.isAccTreeEligible(byId(document, 't'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['templateContent']);
});

test('isAccTreeEligible: <script>/<style> content is non-rendered', () => {
  const { helpers, document } = helpersFor('<script id="sc">1</script>');
  const r = helpers.isAccTreeEligible(byId(document, 'sc'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['nonRenderedElement']);
});

test('isAccTreeEligible: content inside a closed <details> is ineligible; content inside <summary> stays eligible', () => {
  const { helpers, document } = helpersFor(
    '<details id="d"><summary id="sum">Show</summary><p id="p">hidden body</p></details>'
  );
  const closedBody = helpers.isAccTreeEligible(byId(document, 'p'));
  assert.equal(closedBody.eligible, false);
  assert.deepEqual(closedBody.reasons, ['detailsClosed']);

  const summary = helpers.isAccTreeEligible(byId(document, 'sum'));
  assert.equal(summary.eligible, true);
});

test('isAccTreeEligible: content inside an OPEN <details> is eligible', () => {
  const { helpers, document } = helpersFor(
    '<details id="d" open><p id="p">visible body</p></details>'
  );
  const r = helpers.isAccTreeEligible(byId(document, 'p'));
  assert.equal(r.eligible, true);
});

test('isAccTreeEligible: [inert] on an ancestor blocks descendants', () => {
  const { helpers, document } = helpersFor('<div id="wrap" inert><button id="b">x</button></div>');
  const r = helpers.isAccTreeEligible(byId(document, 'b'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['inert']);
});

test('isAccTreeEligible: inert on an <area> itself, or on its <map>, does not block the area (documented exception)', () => {
  const { helpers, document } = helpersFor(
    '<map name="m" inert><area id="a" inert shape="rect" coords="0,0,10,10" href="/x"></map>' +
      '<img usemap="#m" src="i.png">'
  );
  const r = helpers.isAccTreeEligible(byId(document, 'a'));
  assert.equal(r.eligible, true);
});

test('isAccTreeEligible: display:none on an ancestor blocks the whole subtree', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap" style="display:none"><span id="s">x</span></div>'
  );
  const r = helpers.isAccTreeEligible(byId(document, 's'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['displayNone']);
});

test('isAccTreeEligible: visibility:hidden on the node itself blocks it', () => {
  const { helpers, document } = helpersFor('<span id="s" style="visibility:hidden">x</span>');
  const r = helpers.isAccTreeEligible(byId(document, 's'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['visibilityHidden']);
});

test('isAccTreeEligible: visibility:visible on a descendant re-renders it under a visibility:hidden ancestor (visibility is invertible, unlike display)', () => {
  const { helpers, document } = helpersFor(
    '<div style="visibility:hidden"><span id="s" style="visibility:visible">x</span></div>'
  );
  const r = helpers.isAccTreeEligible(byId(document, 's'));
  assert.equal(r.eligible, true);
});

test('isAccTreeEligible: aria-hidden="true" blocks by default', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-hidden="true">x</div>');
  const r = helpers.isAccTreeEligible(byId(document, 'd'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['ariaHidden']);
});

test('isAccTreeEligible: aria-hidden is overridden when the node is referenced by a visible aria-labelledby elsewhere', () => {
  const { helpers, document } = helpersFor(
    '<span id="hidden-heading" aria-hidden="true">Product</span><h2 aria-labelledby="hidden-heading"></h2>'
  );
  const r = helpers.isAccTreeEligible(byId(document, 'hidden-heading'));
  assert.equal(r.eligible, true);
  assert.deepEqual(r.reasons, ['ariaHiddenOverriddenIdref']);
});

test('isAccTreeEligible: aria-hidden with an explicit non-negative tabindex is overridden (still reachable by keyboard)', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-hidden="true" tabindex="0">x</div>');
  const r = helpers.isAccTreeEligible(byId(document, 'd'));
  assert.equal(r.eligible, true);
  assert.deepEqual(r.reasons, ['ariaHiddenOverriddenTabbable']);
});

test('isAccTreeEligible: aria-hidden with an explicit NEGATIVE tabindex (programmatic-only focus) is NOT overridden', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-hidden="true" tabindex="-1">x</div>');
  const r = helpers.isAccTreeEligible(byId(document, 'd'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['ariaHiddenProgrammaticFocusExcluded']);
});

test('isAccTreeEligible: aria-hidden on a natively-focusable <button> with no explicit tabindex is still overridden (real anti-pattern aria-hidden-focus.js targets)', () => {
  const { helpers, document } = helpersFor('<button id="b" aria-hidden="true">x</button>');
  const r = helpers.isAccTreeEligible(byId(document, 'b'));
  assert.equal(r.eligible, true);
  assert.deepEqual(r.reasons, ['ariaHiddenOverriddenTabbable']);
});

test('isAccTreeEligible: aria-hidden on a disabled <button> is NOT overridden (disabled removes native tabbability)', () => {
  const { helpers, document } = helpersFor('<button id="b" aria-hidden="true" disabled>x</button>');
  const r = helpers.isAccTreeEligible(byId(document, 'b'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['ariaHidden']);
});

test('isAccTreeEligible: input[type=hidden] is excluded as a structural blocker before aria-hidden is even considered', () => {
  const { helpers, document } = helpersFor('<input id="h" type="hidden" aria-hidden="true">');
  const r = helpers.isAccTreeEligible(byId(document, 'h'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['inputHidden']);
});

test('isAccTreeEligible: a non-element (e.g. a text node) is ineligible', () => {
  const { helpers, document } = helpersFor('<div id="d">text</div>');
  const textNode = byId(document, 'd').firstChild;
  const r = helpers.isAccTreeEligible(textNode);
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['notElement']);
});

test('isAccTreeEligible: repeated calls on the same node hit the per-scope cache and return an equivalent (but distinct) result object', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-hidden="true">x</div>');
  const node = byId(document, 'd');
  const first = helpers.isAccTreeEligible(node);
  const second = helpers.isAccTreeEligible(node);
  assert.deepEqual(first, second);
  assert.notStrictEqual(
    first.reasons,
    second.reasons,
    'cached reasons array must be cloned, not shared, to prevent caller mutation from corrupting the cache'
  );
});

test('isAccTreeEligible: aria-hidden on an <area> that is part of a USED image map (referenced by an <img usemap>) is overridden even without an explicit tabindex', () => {
  const { helpers, document } = helpersFor(
    '<map name="m"><area id="a" aria-hidden="true" shape="rect" coords="0,0,10,10" href="/x"></map>' +
      '<img usemap="#m" src="i.png">'
  );
  const r = helpers.isAccTreeEligible(byId(document, 'a'));
  assert.equal(r.eligible, true);
  assert.deepEqual(r.reasons, ['ariaHiddenOverriddenTabbable']);
});

test('isAccTreeEligible: aria-hidden on an <area> whose map is NOT referenced by any <img usemap> is NOT overridden (the map is unused)', () => {
  const { helpers, document } = helpersFor(
    '<map name="unused"><area id="a" aria-hidden="true" shape="rect" coords="0,0,10,10" href="/x"></map>'
  );
  const r = helpers.isAccTreeEligible(byId(document, 'a'));
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['ariaHidden']);
});

test('isAccTreeEligible: aria-hidden on <select>/<textarea> (native form controls) is overridden with no explicit tabindex needed', () => {
  const { helpers, document } = helpersFor(
    '<select id="sel" aria-hidden="true"><option>a</option></select>' +
      '<textarea id="ta" aria-hidden="true"></textarea>'
  );
  assert.deepEqual(helpers.isAccTreeEligible(byId(document, 'sel')).reasons, [
    'ariaHiddenOverriddenTabbable'
  ]);
  assert.deepEqual(helpers.isAccTreeEligible(byId(document, 'ta')).reasons, [
    'ariaHiddenOverriddenTabbable'
  ]);
});

test('isAccTreeEligible: aria-hidden on an <a> WITH an href is overridden; on an <a> WITHOUT an href it is NOT (mirrors real tab-order behavior)', () => {
  const { helpers, document } = helpersFor(
    '<a id="withHref" aria-hidden="true" href="/x">x</a>' +
      '<a id="noHref" aria-hidden="true">x</a>'
  );
  const withHref = helpers.isAccTreeEligible(byId(document, 'withHref'));
  assert.equal(withHref.eligible, true);
  assert.deepEqual(withHref.reasons, ['ariaHiddenOverriddenTabbable']);

  const noHref = helpers.isAccTreeEligible(byId(document, 'noHref'));
  assert.equal(noHref.eligible, false);
  assert.deepEqual(noHref.reasons, ['ariaHidden']);
});

test('isAccTreeEligible: content outside an open, aria-modal dialog is ineligible ("modalInert"); content inside it stays eligible', () => {
  const { helpers, document } = helpersFor(
    '<div id="outside">Background</div>' +
      '<dialog id="dlg" open aria-modal="true"><p id="inside">Dialog content</p></dialog>'
  );
  const outside = helpers.isAccTreeEligible(byId(document, 'outside'));
  assert.equal(outside.eligible, false);
  assert.deepEqual(outside.reasons, ['modalInert']);

  const inside = helpers.isAccTreeEligible(byId(document, 'inside'));
  assert.equal(inside.eligible, true);
});

// ===== isDomVisibleEligible =====

test('isDomVisibleEligible: display:none ancestor blocks (styleOnly, the default mode)', () => {
  const { helpers, document } = helpersFor('<div style="display:none"><span id="s">x</span></div>');
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['displayNone']);
});

test('isDomVisibleEligible: content-visibility:hidden on an ancestor blocks', () => {
  const { helpers, document } = helpersFor(
    '<div style="content-visibility:hidden"><span id="s">x</span></div>'
  );
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['contentVisibilityHidden']);
});

test('isDomVisibleEligible: visibility:hidden on the node itself blocks, checked before the opacity chain', () => {
  const { helpers, document } = helpersFor(
    '<span id="s" style="visibility:hidden;opacity:1">x</span>'
  );
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['visibilityHidden']);
});

test('isDomVisibleEligible: opacity:0 on an ancestor blocks by default (styleOnly mode)', () => {
  const { helpers, document } = helpersFor('<div style="opacity:0"><span id="s">x</span></div>');
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['opacityZero']);
});

test('isDomVisibleEligible: opts.ignoreOpacity keeps an opacity:0 element in-scope (used by callers like aria-hidden-focus)', () => {
  const { helpers, document } = helpersFor('<div style="opacity:0"><span id="s">x</span></div>');
  const r = helpers.isDomVisibleEligible(
    byId(document, 's'),
    {},
    { ignoreOpacity: true, disableGeometry: true }
  );
  assert.equal(r.eligible, true);
});

test('isDomVisibleEligible: multiplied opacity across ancestors (e.g. 0.5 * 0.5) still blocks once the product rounds to zero-equivalent', () => {
  const { helpers, document } = helpersFor(
    '<div style="opacity:0.001"><div style="opacity:0.001"><span id="s">x</span></div></div>'
  );
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['opacityZero']);
});

test('isDomVisibleEligible: pointer-events:none on an ancestor blocks only in pointer visibilityMode', () => {
  const { helpers, document } = helpersFor(
    '<div style="pointer-events:none"><span id="s">x</span></div>'
  );
  const stylePointer = helpers.isDomVisibleEligible(
    byId(document, 's'),
    {},
    { visibilityMode: 'pointer', disableGeometry: true }
  );
  assert.equal(stylePointer.eligible, false);
  assert.deepEqual(stylePointer.reasons, ['pointerEventsNone']);

  const styleOnly = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(styleOnly.eligible, true);
});

test('isDomVisibleEligible: a zero-sized element with no client rects is ineligible in styleAndGeometry mode', () => {
  const { helpers, document } = helpersFor(
    '<span id="s" style="width:0;height:0;display:inline-block"></span>'
  );
  const r = helpers.isDomVisibleEligible(
    byId(document, 's'),
    {},
    { visibilityMode: 'styleAndGeometry' }
  );
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.includes('noClientRects'));
});

test('isDomVisibleEligible: geometry checks are skipped entirely with opts.disableGeometry, regardless of visibilityMode', () => {
  const { helpers, document } = helpersFor(
    '<span id="s" style="width:0;height:0;display:inline-block"></span>'
  );
  const r = helpers.isDomVisibleEligible(
    byId(document, 's'),
    {},
    { visibilityMode: 'styleAndGeometry', disableGeometry: true }
  );
  assert.equal(r.eligible, true);
});

test('isDomVisibleEligible: a non-element returns eligible:false, reasons:["notElement"]', () => {
  const { helpers } = helpersFor('<div></div>');
  const r = helpers.isDomVisibleEligible(null, {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['notElement']);
});

test('isDomVisibleEligible: input[type=hidden] as an ANCESTOR (not just the target itself) is a structural blocker', () => {
  const { helpers, document } = helpersFor('<input id="h" type="hidden">');
  const hidden = byId(document, 'h');
  const span = document.createElement('span');
  span.id = 's';
  span.textContent = 'nested via DOM API';
  // <input> can't hold parsed HTML children, but real scripts do append
  // nodes into it via the DOM API; the structural-blocker walk must still
  // catch this the same way it does for hiddenAttr/template/script ancestors.
  hidden.appendChild(span);
  const r = helpers.isDomVisibleEligible(span, {}, {});
  assert.equal(r.eligible, false);
  assert.deepEqual(r.reasons, ['inputHidden']);
});

test('isDomVisibleEligible: visibility:hidden on an ANCESTOR is recorded but does not short-circuit the walk -- a descendant that overrides back to visible (inheriting "visible" itself) stays eligible', () => {
  const { helpers, document } = helpersFor(
    '<div style="visibility:hidden"><div style="visibility:visible"><span id="s">x</span></div></div>'
  );
  const r = helpers.isDomVisibleEligible(byId(document, 's'), {}, {});
  assert.equal(r.eligible, true);
});

test('isDomVisibleEligible: repeated calls on the same node (same mode) hit the per-scope/per-mode cache and return an equivalent result', () => {
  const { helpers, document } = helpersFor('<div style="opacity:0"><span id="s">x</span></div>');
  const node = byId(document, 's');
  const first = helpers.isDomVisibleEligible(node, {}, {});
  const second = helpers.isDomVisibleEligible(node, {}, {});
  assert.deepEqual(first, second);
  assert.notStrictEqual(first.reasons, second.reasons);
});

// ===== getVisibilityHintsInfo =====

test('getVisibilityHintsInfo: opacity:0 produces the "opacityZero" hint and reports the numeric opacity metric', () => {
  const { helpers, document } = helpersFor('<div id="d" style="opacity:0"></div>');
  const info = helpers.getVisibilityHintsInfo(byId(document, 'd'), {}, {});
  assert.ok(info.hints.includes('opacityZero'));
  assert.equal(info.metrics.opacity, 0);
});

test('getVisibilityHintsInfo: the classic visually-hidden clip-rect(0,0,0,0) pattern produces the "clipped" hint', () => {
  const { helpers, document } = helpersFor(
    '<div id="d" style="position:absolute;clip:rect(0,0,0,0)"></div>'
  );
  const info = helpers.getVisibilityHintsInfo(byId(document, 'd'), {}, {});
  assert.ok(info.hints.includes('clipped'));
});

test('getVisibilityHintsInfo: clip-path:inset(50%) produces the "clipped" hint', () => {
  const { helpers, document } = helpersFor('<div id="d" style="clip-path:inset(50%)"></div>');
  const info = helpers.getVisibilityHintsInfo(byId(document, 'd'), {}, {});
  assert.ok(info.hints.includes('clipped'));
});

test('getVisibilityHintsInfo: zero width/height combined with overflow:hidden produces "zeroSizeOverflowHidden"', () => {
  const { helpers, document } = helpersFor(
    '<div id="d" style="width:0px;height:0px;overflow:hidden"></div>'
  );
  const info = helpers.getVisibilityHintsInfo(byId(document, 'd'), {}, {});
  assert.ok(info.hints.includes('zeroSizeOverflowHidden'));
});

test('getVisibilityHintsInfo: an ordinary visible element produces no hints', () => {
  const { helpers, document } = helpersFor('<div id="d">Visible text</div>');
  const info = helpers.getVisibilityHintsInfo(byId(document, 'd'), {}, {});
  assert.deepEqual(info.hints, []);
});

test('getVisibilityHintsInfo: a non-element returns empty hints/metrics and flags "notElement"', () => {
  const { helpers } = helpersFor('<div></div>');
  const info = helpers.getVisibilityHintsInfo(null, {}, {});
  assert.deepEqual(info.hints, []);
  assert.ok(info.flags.includes('notElement'));
});

test('getVisibilityHintsInfo: repeated calls on the same element hit the per-element cache and return an equivalent (but distinct) result object', () => {
  const { helpers, document } = helpersFor('<div id="d" style="opacity:0"></div>');
  const node = byId(document, 'd');
  const first = helpers.getVisibilityHintsInfo(node, {}, {});
  const second = helpers.getVisibilityHintsInfo(node, {}, {});
  assert.deepEqual(first, second);
  assert.notStrictEqual(
    first.hints,
    second.hints,
    'cached hints array must be cloned, not shared, to prevent caller mutation from corrupting the cache'
  );
});

// ===== getRoleInfo (implicit role mapping not already covered elsewhere) =====

test('getRoleInfo: input[type=button|submit|reset|image] all map to the implicit "button" role', () => {
  const { helpers, document } = helpersFor(
    '<input id="b1" type="button"><input id="b2" type="submit">' +
      '<input id="b3" type="reset"><input id="b4" type="image">'
  );
  for (const id of ['b1', 'b2', 'b3', 'b4']) {
    assert.equal(helpers.getRoleInfo(byId(document, id), {}).role, 'button');
  }
});

test('getRoleInfo: a plain text input (default type, and an explicit non-special type like email) maps to the implicit "textbox" role', () => {
  const { helpers, document } = helpersFor('<input id="a"><input id="b" type="email">');
  assert.equal(helpers.getRoleInfo(byId(document, 'a'), {}).role, 'textbox');
  assert.equal(helpers.getRoleInfo(byId(document, 'b'), {}).role, 'textbox');
});

// ===== getFocusableInfo (native-focusability branches not already covered elsewhere) =====

test('getFocusableInfo: a plain text <input> (default type, no explicit tabindex) is focusable via the native mechanism', () => {
  const { helpers, document } = helpersFor('<input id="a">');
  const info = helpers.getFocusableInfo(byId(document, 'a'), {});
  assert.equal(info.focusable, true);
  assert.equal(info.tabbable, true);
  assert.equal(info.mechanism, 'native');
});

test('getFocusableInfo: contenteditable (no explicit value, and explicitly "true") is natively focusable; contenteditable="false" is not', () => {
  const { helpers, document } = helpersFor(
    '<div id="a" contenteditable>x</div>' +
      '<div id="b" contenteditable="true">x</div>' +
      '<div id="c" contenteditable="false">x</div>'
  );
  assert.equal(helpers.getFocusableInfo(byId(document, 'a'), {}).focusable, true);
  assert.equal(helpers.getFocusableInfo(byId(document, 'b'), {}).focusable, true);
  assert.equal(helpers.getFocusableInfo(byId(document, 'c'), {}).focusable, false);
});

test('getFocusableInfo: repeated calls on the same element hit the per-element focusability cache and return an equivalent result', () => {
  const { helpers, document } = helpersFor('<button id="b">x</button>');
  const node = byId(document, 'b');
  const first = helpers.getFocusableInfo(node, {});
  const second = helpers.getFocusableInfo(node, {});
  assert.deepEqual(first, second);
});

// ===== isExcluded / queryAll: malformed selectors must degrade gracefully =====

test('isExcluded: a malformed exclude selector does not throw and simply fails to match', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>', {
    excludeSelectors: ['[[[not-a-selector']
  });
  const target = byId(document, 'd');
  assert.doesNotThrow(() => helpers.isExcluded(target));
  assert.equal(helpers.isExcluded(target), false);
});

test('queryAll: a malformed selector does not throw and simply returns no matches', () => {
  const { helpers } = helpersFor('<div id="d"></div>');
  assert.doesNotThrow(() => helpers.queryAll('[[[not-a-selector'));
  assert.deepEqual(helpers.queryAll('[[[not-a-selector'), []);
});

// ===== queryAllSmart: the "inert" reason is treated differently from hard-hidden reasons =====

test('queryAllSmart: an element that is only [inert] (not display:none/hidden/etc.) still surfaces by default -- inert alone is not a "hard hidden" reason', () => {
  const { helpers } = helpersFor('<div inert><button id="b">x</button></div>');
  const found = helpers.queryAllSmart('button').map((el) => el.id);
  assert.deepEqual(found, ['b']);
});

test('queryAllSmart: [inert] combined with a display:none ancestor is filtered out (the display:none is a genuine hard-hidden reason)', () => {
  const { helpers } = helpersFor('<div inert style="display:none"><button id="b">x</button></div>');
  const found = helpers.queryAllSmart('button').map((el) => el.id);
  assert.deepEqual(found, []);
});

// ===== reportOccurrence =====

test('reportOccurrence: merges the given partial occurrence data with the node reference under __node', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  const node = byId(document, 'd');
  const occ = helpers.reportOccurrence(node, { selector: '#d', html: '<div id="d"></div>' });
  assert.equal(occ.__node, node);
  assert.equal(occ.selector, '#d');
  assert.equal(occ.html, '<div id="d"></div>');
});

test('reportOccurrence: a missing/null partial still produces a valid occurrence shape with __node set', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  const node = byId(document, 'd');
  assert.deepEqual(helpers.reportOccurrence(node, null), { __node: node });
  assert.deepEqual(helpers.reportOccurrence(node, undefined), { __node: node });
});

test('reportOccurrence: an array is not treated as a spreadable partial (guards against Array.isArray edge case), and a null node is preserved as null', () => {
  const { helpers } = helpersFor('<div></div>');
  const occ = helpers.reportOccurrence(null, [1, 2, 3]);
  assert.deepEqual(occ, { __node: null });
});

// ===== getLabelMethod / getLabelStrength =====
// hasLabelAssociation itself is an internal (unexported) primitive backing
// getLabelMethod's "label" result -- exercised here through that public
// surface rather than directly.

test('getLabelMethod: a wrapping <label> with real text resolves to method "label"; no association at all resolves to "none"', () => {
  const { helpers, document } = helpersFor('<label>Full name <input id="a"></label><input id="b">');
  assert.equal(helpers.getLabelMethod(byId(document, 'a'), {}).method, 'label');
  assert.equal(helpers.getLabelMethod(byId(document, 'b'), {}).method, 'none');
});

test('getLabelMethod: a structurally-associated <label> whose only content is an aria-hidden descendant does not count as method "label" (association alone isn\'t enough), so it falls through to the next mechanism', () => {
  const { helpers, document } = helpersFor(
    '<label for="a"><span aria-hidden="true">Ignored</span></label><input id="a" title="Fallback">'
  );
  const m = helpers.getLabelMethod(byId(document, 'a'), {});
  assert.equal(m.method, 'title');
});

test('getLabelMethod: prefers "label" over aria-label/title/placeholder when a real label association exists', () => {
  const { helpers, document } = helpersFor(
    '<label for="a">Real label</label><input id="a" aria-label="ARIA" title="T" placeholder="P">'
  );
  const m = helpers.getLabelMethod(byId(document, 'a'), {});
  assert.equal(m.method, 'label');
});

test('getLabelMethod: falls back through aria-labelledby > aria-label > title > placeholder in that order', () => {
  const { helpers, document } = helpersFor('<input id="a" title="T" placeholder="P">');
  assert.equal(helpers.getLabelMethod(byId(document, 'a'), {}).method, 'title');

  const { helpers: h2, document: d2 } = helpersFor('<input id="a" placeholder="P">');
  assert.equal(h2.getLabelMethod(byId(d2, 'a'), {}).method, 'placeholder');

  const { helpers: h3, document: d3 } = helpersFor('<input id="a" aria-label="ARIA" title="T">');
  assert.equal(h3.getLabelMethod(byId(d3, 'a'), {}).method, 'aria-label');
});

test('getLabelMethod: placeholder is ignored on non-text input types (e.g. checkbox)', () => {
  const { helpers, document } = helpersFor('<input id="a" type="checkbox" placeholder="P">');
  const m = helpers.getLabelMethod(byId(document, 'a'), {});
  assert.equal(m.method, 'none');
});

test('getLabelMethod: no source at all returns method "none", value null', () => {
  const { helpers, document } = helpersFor('<input id="a">');
  const m = helpers.getLabelMethod(byId(document, 'a'), {});
  assert.deepEqual(m, { method: 'none', value: null });
});

test('getLabelStrength: strong for label/aria-labelledby, medium for aria-label, weak for title/placeholder, none otherwise', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.getLabelStrength('label'), 'strong');
  assert.equal(helpers.getLabelStrength('aria-labelledby'), 'strong');
  assert.equal(helpers.getLabelStrength('aria-label'), 'medium');
  assert.equal(helpers.getLabelStrength('title'), 'weak');
  assert.equal(helpers.getLabelStrength('placeholder'), 'weak');
  assert.equal(helpers.getLabelStrength('none'), 'none');
});

// ===== getOuterHtmlSnippet =====

test("getOuterHtmlSnippet: returns the element's outerHTML verbatim when short", () => {
  const { helpers, document } = helpersFor('<div id="d" class="x">hi</div>');
  const snippet = helpers.getOuterHtmlSnippet(byId(document, 'd'));
  assert.equal(snippet, '<div id="d" class="x">hi</div>');
});

test('getOuterHtmlSnippet: truncates very long markup to 2000 chars plus an ellipsis', () => {
  const { helpers, document } = helpersFor(`<div id="d">${'x'.repeat(3000)}</div>`);
  const snippet = helpers.getOuterHtmlSnippet(byId(document, 'd'));
  assert.equal(snippet.length, 2001);
  assert.ok(snippet.endsWith('…'));
});

test('getOuterHtmlSnippet: a non-object input returns an empty string rather than throwing', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.getOuterHtmlSnippet(null), '');
  assert.equal(helpers.getOuterHtmlSnippet(undefined), '');
});

// isWholeDocumentScope is already covered end-to-end by tests/core/fragment-scan.test.js.
