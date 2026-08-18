'use strict';

const { JSDOM } = require('jsdom');
const { runa11yCoreInPage, runDomRulesInPage } = require('../../src/index.js');
const { assertEntryPointParity } = require('./entryPointParity');

function normalizeEngineOptions(opts = {}) {
  const engineOptions = { ...(opts.engineOptions || {}) };

  // Allow top-level convenience options used by checks
  if (opts.excludeSelectors !== undefined && engineOptions.excludeSelectors === undefined) {
    engineOptions.excludeSelectors = opts.excludeSelectors;
  }
  if (opts.includeShadowDom !== undefined && engineOptions.includeShadowDom === undefined) {
    engineOptions.includeShadowDom = opts.includeShadowDom;
  }
  if (opts.rules !== undefined && engineOptions.rules === undefined) {
    engineOptions.rules = opts.rules;
  }

  return engineOptions;
}

/**
 * Runs the scan through the in-page runner (whose result is what callers get
 * back, computed first on a pristine DOM) and then through the Node/jsdom
 * runner, asserting the two entry points agree. See ./entryPointParity.js for
 * why both are exercised on every scenario.
 *
 * Pass `entryPointParity: false` to skip the second run. Only two kinds of
 * test need that, and both because a second scan is not a no-op for them:
 * tests that COUNT a single run's DOM API calls (tests/cache-tests/), and
 * tests of rules that probe the page by mutating it -- iframe-focusable-content
 * moves focus to detect a runtime focus redirect, which a replay can only
 * observe once.
 */
function runBothEntryPoints(url, contextSelector, engineOptions, runOnly, entryPointParity) {
  const inPageResult = runa11yCoreInPage(url, contextSelector, engineOptions, runOnly);
  if (entryPointParity === false) return inPageResult;
  const nodeResult = runDomRulesInPage(url, contextSelector, engineOptions, runOnly);
  assertEntryPointParity(inPageResult, nodeResult);
  return inPageResult;
}

/**
 * Backwards-compatible helper:
 * - Creates a fresh JSDOM per call
 * - Sets global.window/global.document
 * - Runs checks immediately
 */
function runa11yCoreOnHtml(
  html,
  {
    url = 'https://example.test/',
    contextSelector = null,
    engineOptions = {},
    runOnly = null,
    entryPointParity = true,

    // top-level conveniences (checks may pass these)
    excludeSelectors,
    includeShadowDom,
    rules
  } = {}
) {
  const dom = new JSDOM(html, {
    url,
    contentType: 'text/html',
    pretendToBeVisual: true
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const normalizedEngineOptions = normalizeEngineOptions({
    engineOptions,
    excludeSelectors,
    includeShadowDom,
    rules
  });

  // Make engineOptions visible to helpers that run inside core.js
  dom.window.__a11ycoreEngineOptions = normalizedEngineOptions;
  dom.window.document.__a11ycoreEngineOptions = normalizedEngineOptions;

  let result;
  try {
    result = runBothEntryPoints(
      url,
      contextSelector,
      normalizedEngineOptions,
      runOnly,
      entryPointParity
    );
    return result;
  } finally {
    // Attach debug counters if available and enabled
    try {
      if (
        result &&
        normalizedEngineOptions &&
        normalizedEngineOptions.perfStats &&
        dom.window.__a11ycorePerfStatsSnapshot
      ) {
        // Don't mutate official schema fields; add a debug-only property.
        result._debug = result._debug || {};
        result._debug.perf = dom.window.__a11ycorePerfStatsSnapshot;
      }
    } catch (_) {}
    // Attach per-rule timings if available and enabled
    try {
      if (
        result &&
        normalizedEngineOptions &&
        normalizedEngineOptions.profileRules &&
        dom.window.__a11ycoreRuleTimingsSnapshot
      ) {
        result.ruleTimings = dom.window.__a11ycoreRuleTimingsSnapshot;
      }
    } catch (_) {}
    try {
      dom.window && dom.window.close && dom.window.close();
    } catch (_) {}
  }
}

/**
 * New helper: build a DOM and return it so checks can mutate it (e.g., attachShadow)
 * before running checks.
 */
function createDom(html, { url = 'https://example.test/', contentType = 'text/html' } = {}) {
  const dom = new JSDOM(html, { url, contentType, pretendToBeVisual: true });

  // Optional: make the realm available immediately for checks that patch globals before running.
  global.window = dom.window;
  global.document = dom.window.document;

  return dom;
}

/**
 * New helper: run checks on an existing JSDOM instance (supports Shadow DOM mutations).
 */
function runa11yCoreOnDom(
  dom,
  {
    url = 'https://example.test/',
    contextSelector = null,
    engineOptions = {},
    runOnly = null,
    entryPointParity = true,

    // top-level conveniences (checks may pass these)
    excludeSelectors,
    includeShadowDom,
    rules
  } = {}
) {
  if (!dom || !dom.window || !dom.window.document) {
    throw new Error('runa11yCoreOnDom(dom, ...) requires a JSDOM instance.');
  }

  global.window = dom.window;
  global.document = dom.window.document;

  const normalizedEngineOptions = normalizeEngineOptions({
    engineOptions,
    excludeSelectors,
    includeShadowDom,
    rules
  });

  return runBothEntryPoints(
    url,
    contextSelector,
    normalizedEngineOptions,
    runOnly,
    entryPointParity
  );
}

module.exports = runa11yCoreOnHtml;
module.exports.runa11yCoreOnHtml = runa11yCoreOnHtml;
module.exports.createDom = createDom;
module.exports.runa11yCoreOnDom = runa11yCoreOnDom;
