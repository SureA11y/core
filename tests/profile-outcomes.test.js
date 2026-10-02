'use strict';

/**
 * A profile chooses which rules run, never what they decide. Under every
 * conformance profile, core's and each registered standard's, every rule the
 * profile runs gives, over its own scenario page, the result it gives when run
 * on its own at the WCAG version that profile targets.
 *
 * This is what keeps a standard's decisions in its own tables: a rule that
 * branched on the profile would make a standard's verdicts depend on code in
 * core. It replaces the per-rule "same outcome under each profile" checks, so
 * a rule's own test need not name any standard.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { runDomRulesInPage, getChecksCatalog } = require('../src/index.js');
const { standardsData } = require('../src/coverage/standards.js');
const { ruleSources } = require('../scripts/lib/rule-dirs');

// Core's own profiles (docs/ENGINE_OPTIONS.md), then every registered
// standard's.
const PROFILES = ['wcag22-aa', 'section508'].concat(
  standardsData().flatMap((s) => Object.keys(s.profiles || {}))
);

const ALL_RULES = getChecksCatalog({ optInRules: 'all' }).map((r) => r.ruleId);

// Every rule with a scenario page, from core's fixture index and each profile's.
const PAGES = ruleSources().flatMap((src) => {
  const index = path.join(src.fixturesDir, 'index.json');
  if (!fs.existsSync(index)) return [];
  return JSON.parse(fs.readFileSync(index, 'utf8'))
    .rows.filter((r) => r.fixtureFile && ALL_RULES.includes(r.ruleId))
    .map((r) => ({ ruleId: r.ruleId, file: path.join(src.root, r.fixtureFile) }));
});

const summary = (check) =>
  check &&
  JSON.stringify({
    outcome: check.outcome,
    occurrences: (check.occurrences || []).map((o) => [o.selector, o.occurrenceOutcome || null])
  });

test('every profile leaves the outcome of each rule it runs unchanged', () => {
  assert.ok(PROFILES.length > 2 && PAGES.length > 100);
  const differences = [];

  for (const { ruleId, file } of PAGES) {
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
      url: 'https://example.test/',
      pretendToBeVisual: true
    });
    global.window = dom.window;
    global.document = dom.window.document;
    const run = (engineOptions, runOnly) => runDomRulesInPage(null, null, engineOptions, runOnly);
    const others = ALL_RULES.filter((id) => id !== ruleId);
    const alone = new Map(); // WCAG version -> the rule's result run on its own

    try {
      for (const profile of PROFILES) {
        // An exclude narrows a profile without replacing it, so only this
        // rule runs, with everything else the profile sets.
        const result = run({ profile }, { excludeRuleIds: others });
        const check = result.checksResults.find((r) => r.ruleId === ruleId);
        if (!check) continue; // the profile does not run it
        const version = result.engine.wcagVersion;
        if (!alone.has(version)) {
          const own = run(
            { wcagVersion: version, optInRules: 'all' },
            { includeRuleIds: [ruleId] }
          );
          alone.set(version, summary(own.checksResults.find((r) => r.ruleId === ruleId)));
        }
        if (summary(check) !== alone.get(version)) {
          differences.push(`${ruleId} under ${profile} (WCAG ${version})`);
        }
      }
    } finally {
      dom.window.close();
    }
  }

  assert.deepEqual(differences, []);
});
