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
