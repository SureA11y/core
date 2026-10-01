'use strict';

/**
 * tests/profile-outcomes.test.js for a standard registered as a profile: under
 * the sample profile's profiles, every rule they run gives, over its own
 * scenario page, the result it gives when run on its own at the WCAG version
 * that profile targets. Run against the engine copy with the sample profile
 * (tests/helpers/sampleEngine.js), over core's scenario pages.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { requireSample } = require('../helpers/sampleEngine');

const { runDomRulesInPage, getChecksCatalog } = requireSample('src/index.js');

const PROFILES = ['sample-1.0', 'sample-2.0'];
const ALL_RULES = getChecksCatalog({ optInRules: 'all' }).map((r) => r.ruleId);

const ROOT = path.join(__dirname, '..', '..');
const PAGES = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'index.json'), 'utf8')
)
  .rows.filter((r) => r.fixtureFile && ALL_RULES.includes(r.ruleId))
  .map((r) => ({ ruleId: r.ruleId, file: path.join(ROOT, r.fixtureFile) }));

const summary = (check) =>
  check &&
  JSON.stringify({
    outcome: check.outcome,
    occurrences: (check.occurrences || []).map((o) => [o.selector, o.occurrenceOutcome || null])
  });

test('the sample profile leaves the outcome of each rule it runs unchanged', () => {
  assert.ok(PAGES.length > 100);
  const differences = [];
  let ran = 0;

  for (const { ruleId, file } of PAGES) {
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
      url: 'https://example.test/',
      pretendToBeVisual: true
    });
    global.window = dom.window;
    global.document = dom.window.document;
    const run = (engineOptions, runOnly) => runDomRulesInPage(null, null, engineOptions, runOnly);
    const others = ALL_RULES.filter((id) => id !== ruleId);
    const alone = new Map();

    try {
      for (const profile of PROFILES) {
        const result = run({ profile }, { excludeRuleIds: others });
        const check = result.checksResults.find((r) => r.ruleId === ruleId);
        if (!check) continue;
        ran += 1;
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

  assert.ok(ran > 100);
  assert.deepEqual(differences, []);
});
