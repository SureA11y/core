'use strict';

/**
 * Every rule already has a comprehensive "-all-scenarios.html" fixture
 * covering every branch its logic distinguishes (mandatory per
 * CONTRIBUTING.md/RULE_AUTHORING.md §11) -- but nearly every existing test
 * drives it through runa11yCoreInPage (tests/helpers/runDomRulesOnHtml.js),
 * the SELF-CONTAINED in-page runner: every rule's runInPage is re-embedded
 * as literal source text (Function.prototype.toString(), see
 * scripts/build-core.js's "implEntriesInPage") so the whole engine can be
 * dropped into page.evaluate() for the Playwright/Puppeteer/etc. bindings
 * with zero require() calls. That's real, correct behavior -- but Node's
 * --experimental-test-coverage can only attribute that execution to
 * src/core.js (where the re-embedded copy actually lives), never back to
 * the original src/checks/**\/*.js file, so per-rule-file coverage looked
 * near-zero for ~123 of 125 rules regardless of how thorough their fixture
 * actually was (aria-hidden-focus.js went from 18%
 * to 84% line coverage just by running its EXISTING fixture through the
 * other entry point below -- zero new test cases).
 *
 * runDomRulesInPage (the Node/jsdom-direct entry point the CLI in
 * @surea11y/cli uses) dispatches through real require() references
 * (scripts/build-core.js's "implEntries" / RULE_IMPLS), so Node CAN
 * attribute coverage correctly there. Running every rule's own existing
 * fixture through it -- once, here -- fixes coverage attribution with no
 * new fixture cases and no change to the ~1400 existing tests or to what
 * they cover.
 *
 * This also earns its own keep as a real regression check, not just a
 * coverage side effect: RULE_IMPLS and the in-page copy are supposed to be
 * byte-identical (the in-page copy IS the other one's toString()), but
 * nothing previously verified that on every rule -- comparing outcomes
 * from both entry points against the same fixture catches the two ever
 * silently drifting apart.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { runDomRulesInPage, runa11yCoreInPage } = require('../src/index.js');

const fixturesIndex = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'index.json'), 'utf8')
);

function runViaEntryPoint(entryPointFn, html, ruleId) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return entryPointFn('https://example.test/', null, {}, { includeRuleIds: [ruleId] });
  } finally {
    dom.window.close();
  }
}

for (const row of fixturesIndex.rows) {
  test(`${row.ruleId}: runDomRulesInPage and runa11yCoreInPage agree on its own fixture`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', row.fixtureFile), 'utf8');

    const nodeResult = runViaEntryPoint(runDomRulesInPage, html, row.ruleId);
    const inPageResult = runViaEntryPoint(runa11yCoreInPage, html, row.ruleId);

    const nodeCheck = nodeResult.checksResults.find((r) => r.ruleId === row.ruleId);
    const inPageCheck = inPageResult.checksResults.find((r) => r.ruleId === row.ruleId);

    assert.ok(nodeCheck, `runDomRulesInPage produced no checksResults entry for ${row.ruleId}`);
    assert.ok(inPageCheck, `runa11yCoreInPage produced no checksResults entry for ${row.ruleId}`);
    assert.ok(!nodeCheck.error, `${row.ruleId} threw via runDomRulesInPage: ${nodeCheck.error}`);
    assert.ok(
      !inPageCheck.error,
      `${row.ruleId} threw via runa11yCoreInPage: ${inPageCheck.error}`
    );

    assert.strictEqual(
      nodeCheck.outcome,
      inPageCheck.outcome,
      `${row.ruleId}: outcome differs between entry points`
    );
    assert.strictEqual(
      nodeCheck.occurrences.length,
      inPageCheck.occurrences.length,
      `${row.ruleId}: occurrence count differs between entry points`
    );
  });
}
