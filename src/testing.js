/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @surea11y/core/testing: what core's own rule tests use, for a pack's (or
 * any rule's) tests: scan an HTML string or a JSDOM in jsdom, through both
 * entry points, and assert a rule's outcome. A scan with packs runs through
 * runDomRulesInPage. Needs jsdom, which this package does not install:
 * `npm install --save-dev jsdom`.
 */

const assert = require('node:assert');
const { runa11yCoreInPage, runDomRulesInPage } = require('./index.js');

// jsdom's JSDOM, loaded on first use: core itself doesn't depend on jsdom.
let JSDOMClass = null;
function jsdom() {
  if (!JSDOMClass) {
    try {
      ({ JSDOM: JSDOMClass } = require('jsdom'));
    } catch (err) {
      throw new Error('@surea11y/core/testing needs jsdom: npm install --save-dev jsdom', {
        cause: err
      });
    }
  }
  return JSDOMClass;
}

// --- the two entry points agree (in-page and Node) ------------------------------
/**
 * Runs a scan through BOTH engine entry points and asserts they agree.
 *
 * The engine ships the same rule logic twice on purpose (see
 * scripts/build-core.js):
 *
 * - `runa11yCoreInPage` is the SELF-CONTAINED in-page runner. Every rule's
 *   `runInPage` is re-embedded into src/core.js as literal source text
 *   (Function.prototype.toString(), the build's "implEntriesInPage"), so the
 *   whole engine can be dropped into `page.evaluate()` by the Playwright/
 *   Puppeteer/etc. bindings with zero require() calls.
 * - `runDomRulesInPage` is the Node/jsdom-direct runner (the build's
 *   "implEntries" / RULE_IMPLS) that dispatches through real require()
 *   references to src/checks/**\/*.js. It is what @surea11y/cli uses.
 *
 * The two are supposed to be byte-identical -- the in-page copy IS the other
 * one's toString() -- but nothing verifies that per scenario.
 * tests/node-runtime-parity.test.js checks it once per rule against that
 * rule's "-all-scenarios.html" fixture; wiring the check into the shared
 * test helper extends the same guarantee to every scenario every rule test
 * already exercises (engineOptions variants, shadow DOM, scoped/excluded
 * scans, locale overrides, custom rules...), which is where the two copies
 * are most likely to silently drift.
 *
 * It also fixes coverage attribution: Node's --experimental-test-coverage can
 * only attribute the in-page runner's execution to src/core.js (where the
 * re-embedded copy actually lives), never back to the original rule file, so
 * per-rule-file coverage reflected only the single fixture run through
 * runDomRulesInPage. Driving each existing scenario through both entry points
 * reports what those scenarios actually cover.
 *
 * The in-page result is what callers get back, and it is computed FIRST, on a
 * pristine DOM -- the parity run must never change what a test observes.
 */

function summarize(result) {
  const checks = result && Array.isArray(result.checksResults) ? result.checksResults : [];
  const out = new Map();
  for (const r of checks) {
    if (!r || typeof r.ruleId !== 'string') continue;
    out.set(r.ruleId, {
      outcome: r.outcome,
      occurrences: Array.isArray(r.occurrences) ? r.occurrences.length : 0,
      error: r.error ? String(r.error) : null
    });
  }
  return out;
}

function assertEntryPointParity(inPageResult, nodeResult) {
  const inPage = summarize(inPageResult);
  const node = summarize(nodeResult);

  assert.deepStrictEqual(
    [...node.keys()].sort(),
    [...inPage.keys()].sort(),
    'runDomRulesInPage and runa11yCoreInPage reported different rule ids for the same scan'
  );

  for (const [ruleId, inPageEntry] of inPage) {
    const nodeEntry = node.get(ruleId);
    assert.deepStrictEqual(
      nodeEntry,
      inPageEntry,
      `${ruleId}: runDomRulesInPage and runa11yCoreInPage disagree on the same scan ` +
        `(node=${JSON.stringify(nodeEntry)}, inPage=${JSON.stringify(inPageEntry)})`
    );
  }
}

// --- scanning HTML and a JSDOM -----------------------------------------------------
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
 * runner, asserting the two entry points agree. See assertEntryPointParity above for
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
  // A scan with packs runs through runDomRulesInPage: the in-page runner has
  // only the rules it was built with (src/pack.js).
  if (engineOptions && Array.isArray(engineOptions.packs) && engineOptions.packs.length) {
    return runDomRulesInPage(url, contextSelector, engineOptions, runOnly);
  }
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
  const dom = new (jsdom())(html, {
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
    } catch {}
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
    } catch {}
    try {
      dom.window && dom.window.close && dom.window.close();
    } catch {}
  }
}

/**
 * New helper: build a DOM and return it so checks can mutate it (e.g., attachShadow)
 * before running checks.
 */
function createDom(html, { url = 'https://example.test/', contentType = 'text/html' } = {}) {
  const dom = new (jsdom())(html, { url, contentType, pretendToBeVisual: true });

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

// --- asserting a rule's outcome ------------------------------------------------------
function assertRule(result, ruleId, expectedOutcome, opts = {}) {
  const { minOccurrences = 0, maxOccurrences = null } = opts;

  assert.ok(result && typeof result === 'object', 'Expected result to be an object');
  assert.ok(Array.isArray(result.checksResults), 'Expected result.checks to be an array');

  const engineTag =
    result.engine && typeof result.engine.tag === 'string' && result.engine.tag.trim()
      ? result.engine.tag.trim()
      : null;

  const candidates = [ruleId];

  // If caller passed an unprefixed id like "manual-review", also try "manual-review"
  if (engineTag && !ruleId.startsWith(engineTag + '-')) {
    candidates.push(`${engineTag}-${ruleId}`);
  }

  const rule = result.checksResults.find((r) => r && candidates.includes(r.ruleId));
  assert.ok(rule, `Expected to find rule ${ruleId} in result.checksResults`);

  assert.strictEqual(
    rule.outcome,
    expectedOutcome,
    `Expected ${rule.ruleId} outcome to be ${expectedOutcome}, got ${rule.outcome}`
  );

  const occs = Array.isArray(rule.occurrences) ? rule.occurrences : [];
  assert.ok(
    occs.length >= minOccurrences,
    `Expected ${rule.ruleId} to have at least ${minOccurrences} occurrences, got ${occs.length}`
  );

  if (maxOccurrences != null) {
    assert.ok(
      occs.length <= maxOccurrences,
      `Expected ${rule.ruleId} to have <= ${maxOccurrences} occurrences, got ${occs.length}`
    );
  }

  return rule;
}

module.exports = {
  runa11yCoreOnHtml,
  runa11yCoreOnDom,
  createDom,
  assertRule,
  assertEntryPointParity
};
