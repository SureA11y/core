'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml.js');
const { assertRule } = require('../helpers/assertRule.js');

const RULE_ID = 'bypass-blocks-present';

/**
 * Regression coverage for https://github.com/SureA11y/core/issues/2
 *
 * createDomHelpers() persists element-keyed caches (outerHtmlCache,
 * selectorCache, etc.) on window.__a11ycoreSharedCache so multiple helper
 * instances created *within one run* can share them. Because the cache is
 * keyed by element reference (not content) and document.body keeps the same
 * reference for the lifetime of a window, a window reused across SEPARATE
 * runs -- e.g. a Jest jsdom environment reused across it() blocks -- could
 * read back a previous run's stale outerHTML snapshot for an element whose
 * content changed via innerHTML mutation in between.
 */

test('regression: bypass-blocks-present does not report stale occurrences[].html across repeated runs on the same window (GH #2)', () => {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body></body></html>'
  );
  const { document } = dom.window;

  // Run 1: body has a <main>, so the rule passes.
  document.body.innerHTML = '<main><img src="dummy.png" alt="Decorative square" /></main>';
  const result1 = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result1, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

  // Run 2: mutate the SAME document.body in place (same object reference,
  // different content) so no main/anchor/heading remains.
  document.body.innerHTML = '<img src="dummy.png" />';
  const result2 = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule2 = assertRule(result2, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  // The reported html snippet must reflect THIS run's body, not run 1's
  // leftover <main> markup.
  assert.ok(
    rule2.occurrences[0].html.includes('<img src="dummy.png">'),
    `expected occurrences[0].html to reflect run 2's body, got: ${rule2.occurrences[0].html}`
  );
  assert.ok(
    !rule2.occurrences[0].html.includes('<main>'),
    `occurrences[0].html leaked stale run-1 markup: ${rule2.occurrences[0].html}`
  );
});

test('regression: window.__a11ycoreSharedCache is reset at the start of every run, not reused across runs (GH #2)', () => {
  const dom = createDom('<!doctype html><html><body><main>Content</main></body></html>');
  const { window } = dom;

  runa11yCoreOnDom(dom, {});
  assert.ok(
    window.__a11ycoreSharedCache && window.__a11ycoreSharedCache.dom,
    'expected shared dom cache to be populated after run 1'
  );
  const outerHtmlCacheRun1 = window.__a11ycoreSharedCache.dom.outerHtmlCache;
  assert.ok(
    outerHtmlCacheRun1 instanceof WeakMap,
    'expected outerHtmlCache to be a WeakMap after run 1'
  );

  runa11yCoreOnDom(dom, {});
  const outerHtmlCacheRun2 = window.__a11ycoreSharedCache.dom.outerHtmlCache;

  assert.notStrictEqual(
    outerHtmlCacheRun2,
    outerHtmlCacheRun1,
    'expected a fresh outerHtmlCache instance for run 2 (shared cache must not survive across separate runs)'
  );
});
