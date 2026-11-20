'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml.js');

// entryPointParity: false throughout -- this file asserts what a *single* engine
// run does to the per-run caches, so the helper must not replay each scan through
// the second entry point.
const { assertRule } = require('../helpers/assertRule.js');

const RULE_ID = 'bypass-blocks-present';

/**
 * Regression coverage for https://github.com/SureA11y/core/issues/2
 *
 * createDomHelpers() keeps element-keyed caches (outerHtmlCache,
 * selectorCache, etc.) on window.__a11ycoreSharedCache while a run lasts so
 * multiple helper instances created *within one run* can share them. Because
 * the cache is keyed by element reference (not content) and document.body
 * keeps the same reference for the lifetime of a window, a window reused
 * across SEPARATE runs -- e.g. a Jest jsdom environment reused across it()
 * blocks -- could
 * read back a previous run's stale outerHTML snapshot for an element whose
 * content changed via innerHTML mutation in between.
 */

test('regression: bypass-blocks-present does not report stale occurrences[].html across repeated runs on the same window (GH #2)', () => {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body></body></html>'
  );
  const { document } = dom.window;

  // Run 1: nothing gives a bypass mechanism, so the rule reports <body>, and
  // its snippet is cached for that element. <body>'s snippet is its start tag
  // (the whole page would change with every edit), so it is the attributes
  // that change between the runs.
  document.body.className = 'run-1';
  document.body.innerHTML = '<img src="dummy.png" />';
  const result1 = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule1 = assertRule(result1, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule1.occurrences[0].html, '<body class="run-1">');

  // Run 2: mutate the SAME document.body in place (same object reference,
  // different markup).
  document.body.className = 'run-2';
  const result2 = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule2 = assertRule(result2, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  // The reported html snippet must reflect THIS run's body, not run 1's.
  assert.strictEqual(
    rule2.occurrences[0].html,
    '<body class="run-2">',
    `occurrences[0].html leaked stale run-1 markup: ${rule2.occurrences[0].html}`
  );
});

test('regression: window.__a11ycoreSharedCache does not outlive a run (GH #2)', () => {
  // Removed when the run ends, so nothing cached by one run is read by the
  // next, and scanned elements are not kept alive in between.
  const dom = createDom('<!doctype html><html><body><main>Content</main></body></html>');
  const { window } = dom;

  runa11yCoreOnDom(dom, { entryPointParity: false });
  assert.strictEqual(window.__a11ycoreSharedCache, undefined, 'left on the window after run 1');

  // A cache left by something else (an older engine on the same window) is
  // not read either: the run starts from a fresh one.
  const stale = { dom: { outerHtmlCache: new WeakMap() } };
  window.__a11ycoreSharedCache = stale;
  runa11yCoreOnDom(dom, { entryPointParity: false });
  assert.strictEqual(window.__a11ycoreSharedCache, undefined, 'left on the window after run 2');
});
