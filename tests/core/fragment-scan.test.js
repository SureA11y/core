'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { createAriaHelpers } = require('../../src/core/aria-helpers.js');
const { assertRule } = require('../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

function makeDom(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  return { window: dom.window, document: dom.window.document };
}

test('isWholeDocumentScope: true by default (unscoped -- root is document.documentElement)', () => {
  const { window, document } = makeDom('<!doctype html><html><body><div id="d"></div></body></html>');
  const helpers = createDomHelpers({ window, document, root: document.documentElement });

  assert.equal(helpers.isWholeDocumentScope(), true);
});

test('isWholeDocumentScope: false when contextSelector scoped this run narrower than the whole document', () => {
  const { window, document } = makeDom('<!doctype html><html><body><div id="d"></div></body></html>');
  const scopedRoot = document.getElementById('d');
  const helpers = createDomHelpers({ window, document, root: scopedRoot });

  assert.equal(helpers.isWholeDocumentScope(), false);
});

test('isWholeDocumentScope: false when engineOptions.fragment is true, even when unscoped', () => {
  const { window, document } = makeDom('<!doctype html><html><body><div id="d"></div></body></html>');
  const helpers = createDomHelpers({ window, document, root: document.documentElement, fragment: true });

  assert.equal(helpers.isWholeDocumentScope(), false);
});

test('isWholeDocumentScope: true when a multi-region contextSelector array includes document.documentElement', () => {
  const { window, document } = makeDom('<!doctype html><html><body><div id="d"></div></body></html>');
  const helpers = createDomHelpers({ window, document, root: [document.documentElement, document.getElementById('d')] });

  assert.equal(helpers.isWholeDocumentScope(), true);
});

// End-to-end smoke tests (the exhaustive per-rule "notApplicable when scoped/
// fragment" cases live in each of the 14 affected rules' own test files --
// these two are just cross-cutting confirmation that an automatic rule
// (page-title-present) and a manual/cantTell-capable one (bypass-blocks-present)
// both correctly gate via the same mechanism).
test('page-title-present: fail unscoped, notApplicable when scoped to a subtree', () => {
  const html = '<!doctype html><html lang="en"><head></head><body><div id="target"><p>Hi</p></div></body></html>';

  const unscoped = runa11yCoreOnHtml(html, { runOnly: ['page-title-present'] });
  assertRule(unscoped, 'page-title-present', 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const scoped = runa11yCoreOnHtml(html, { runOnly: ['page-title-present'], contextSelector: '#target' });
  assertRule(scoped, 'page-title-present', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('bypass-blocks-present: fail unscoped, notApplicable with engineOptions.fragment: true', () => {
  const html = '<!doctype html><html><body><a href="#missing">Skip</a><nav>Nav</nav><div>Content</div></body></html>';

  const unscoped = runa11yCoreOnHtml(html, { runOnly: ['bypass-blocks-present'] });
  assertRule(unscoped, 'bypass-blocks-present', 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const fragment = runa11yCoreOnHtml(html, { runOnly: ['bypass-blocks-present'], engineOptions: { fragment: true } });
  assertRule(fragment, 'bypass-blocks-present', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// --- Landmark ancestor-walk scope-boundary regression (found via the same
// fragment-scan audit): hasLandmarkScopingAncestor (shared, aria-helpers.js)
// and the local hasLandmarkAncestor (landmark-*-is-top-level-manual.js) both
// used to climb via parentElement with NO scope boundary, so a
// contextSelector-scoped scan could be affected by real DOM ancestry OUTSIDE
// the analyzed subtree -- a page's own <nav> wrapping a scanned #widget
// region, for instance, would incorrectly count as a landmark ancestor of
// something *inside* #widget even though that <nav> itself was never in scope.

test('hasLandmarkScopingAncestor: does not climb past the scanned root (scope-boundary fix)', () => {
  // <header> is nested inside <nav> (a scoping ancestor) -- but the scan is
  // scoped to #widget, and <nav> is OUTSIDE #widget's subtree entirely.
  const { window, document } = makeDom(
    '<!doctype html><html><body><nav><div id="widget"><header id="h">Site</header></div></nav></body></html>'
  );
  const widget = document.getElementById('widget');
  const header = document.getElementById('h');

  const scopedAria = createAriaHelpers({ window, document, root: widget }, {});
  assert.equal(
    scopedAria.hasLandmarkScopingAncestor(header, { includeMain: true }),
    false,
    'the <nav> ancestor is outside the scanned scope, so it must not suppress <header>\'s implicit banner role'
  );

  const unscopedAria = createAriaHelpers({ window, document, root: document.documentElement }, {});
  assert.equal(
    unscopedAria.hasLandmarkScopingAncestor(header, { includeMain: true }),
    true,
    'unscoped (whole document), the same <nav> ancestor is legitimately in scope and should still suppress it'
  );
});

test('landmark-banner-is-top-level: a real page\'s outer <nav> does not leak into a #widget-scoped scan', () => {
  // Explicit role="banner" (rather than a bare <header>) deliberately isolates
  // hasLandmarkAncestor's own bug from hasLandmarkScopingAncestor's separate
  // mechanism: <nav> is itself one of the sectioning-content tags that
  // suppresses a bare <header>'s implicit "banner" role, so a <header> would
  // never even reach hasLandmarkAncestor here. An explicit role bypasses that
  // suppression entirely and is only ever gated by hasLandmarkAncestor.
  const html = '<!doctype html><html><body><nav><div id="widget"><div role="banner" id="b">Site</div></div></nav></body></html>';

  // Unscoped: the explicit banner is genuinely nested inside a real <nav> landmark -- a real finding.
  const unscoped = runa11yCoreOnHtml(html, { runOnly: ['landmark-banner-is-top-level'] });
  assertRule(unscoped, 'landmark-banner-is-top-level', 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  // Scoped to #widget: the <nav> is outside the analyzed subtree and must not leak in.
  const scoped = runa11yCoreOnHtml(html, { runOnly: ['landmark-banner-is-top-level'], contextSelector: '#widget' });
  assertRule(scoped, 'landmark-banner-is-top-level', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
