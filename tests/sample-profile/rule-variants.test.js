'use strict';

/**
 * Rule variants at run time, through the sample profile's
 * sample-contrast-enhanced, a variant of contrast-minimum at 7:1 (4.5:1 for
 * large text): it runs its base's code with its own settings and messages,
 * a caller cannot change those settings, and running it leaves its base's
 * results unchanged. Run against the engine copy with the sample profile
 * (tests/helpers/sampleEngine.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { requireSample } = require('../helpers/sampleEngine');

const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const { ruleDirs } = requireSample('scripts/lib/rule-dirs.js');

const VARIANT = 'sample-contrast-enhanced';

// #767676 on #fff is about 4.54:1: passes 4.5:1, fails 7:1.
const GREY =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<p id="grey" style="font-size:16px;color:#767676;background:#fff">Grey text</p>' +
  '</main></body></html>';

const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test('a variant runs its base with its own settings and its own messages', () => {
  const result = runa11yCoreOnHtml(GREY, { engineOptions: { profile: 'sample-1.0' } });
  assert.equal(check(result, 'contrast-minimum').outcome, 'pass');
  const variant = check(result, VARIANT);
  assert.equal(variant.outcome, 'fail');
  assert.equal(variant.occurrences.length, 1);
  assert.equal(
    variant.occurrences[0].i18n.summaryKey,
    'sampleContrastEnhanced_fail_belowThreshold'
  );
});

test("a caller's config cannot change a variant's settings", () => {
  const outcome = (rules) =>
    check(
      runa11yCoreOnHtml(GREY, {
        engineOptions: { profile: 'sample-1.0', rules },
        runOnly: { includeRuleIds: [VARIANT] }
      }),
      VARIANT
    ).outcome;
  assert.equal(outcome({}), 'fail');
  assert.equal(outcome({ [VARIANT]: { normalTextRatio: 4.5 } }), 'fail');
  assert.equal(
    outcome({ [VARIANT]: { normalTextRatio: 4.5, excludeSelectors: ['#grey'] } }),
    'notApplicable',
    'excludeSelectors still applies'
  );
});

// A variant shares its base's code and, through the helpers, its caches. Its
// settings must stay its own: for every variant the build has, the base rule
// gives the same result over its own scenario page whether or not the variant
// runs in the same scan, in either order.
test("every variant leaves its base rule's results unchanged", () => {
  const variants = ruleDirs()
    .flatMap((dir) =>
      ['automatic', 'manual']
        .map((type) => path.join(dir, type))
        .filter((d) => fs.existsSync(d))
        .flatMap((d) => fs.readdirSync(d).map((f) => path.join(d, f)))
    )
    .map((file) => require(file))
    .filter((mod) => mod && typeof mod.from === 'string');
  assert.ok(variants.length > 0);

  // Core's scenario pages, by rule (a variant's base is a core rule).
  const index = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'index.json'), 'utf8')
  );
  const pageOf = new Map(
    index.rows
      .filter((r) => r.fixtureFile)
      .map((r) => [r.ruleId, path.join(__dirname, '..', '..', r.fixtureFile)])
  );

  const summary = (result, id) =>
    JSON.stringify(
      result.checksResults
        .filter((r) => r.ruleId === id)
        .map((r) => ({
          outcome: r.outcome,
          occurrences: (r.occurrences || []).map((o) => [o.selector, o.data && o.data.details])
        }))
    );

  for (const { id, from } of variants) {
    assert.ok(pageOf.has(from), `${from} has a scenario page`);
    const html = fs.readFileSync(pageOf.get(from), 'utf8');
    const run = (ids) =>
      runa11yCoreOnHtml(html, {
        engineOptions: { optInRules: 'all' },
        runOnly: { includeRuleIds: ids }
      });
    const alone = summary(run([from]), from);
    assert.equal(summary(run([from, id]), from), alone, `${id} after ${from}`);
    assert.equal(summary(run([id, from]), from), alone, `${id} before ${from}`);
  }
});
