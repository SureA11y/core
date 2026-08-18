'use strict';

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
 * reports what those scenarios genuinely cover.
 *
 * The in-page result is what callers get back, and it is computed FIRST, on a
 * pristine DOM -- the parity run must never change what a test observes.
 */

const assert = require('node:assert');

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

module.exports = { assertEntryPointParity };
