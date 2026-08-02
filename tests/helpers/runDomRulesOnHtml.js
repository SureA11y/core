'use strict';

const { JSDOM } = require('jsdom');
const { runa11yCoreInPage } = require('../../src/index.js');

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
    result = runa11yCoreInPage(url, contextSelector, normalizedEngineOptions, runOnly);
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

  return runa11yCoreInPage(url, contextSelector, normalizedEngineOptions, runOnly);
}

module.exports = runa11yCoreOnHtml;
module.exports.runa11yCoreOnHtml = runa11yCoreOnHtml;
module.exports.createDom = createDom;
module.exports.runa11yCoreOnDom = runa11yCoreOnDom;
