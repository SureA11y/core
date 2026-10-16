'use strict';

/**
 * A profile that waives a criterion (exclude: { criteria }) leaves out the
 * criterion's rollup and the rules whose every criterion it waives. A rule
 * that also checks a criterion the profile keeps still runs, as
 * profileExclusions in src/coverage/standards.js and the docs say. The
 * waived rollups used to be excluded among excludeRuleIds, where a rollup id
 * excludes every rule of the rollup, so link-name-present (2.4.4 and 4.1.2)
 * didn't run under a profile waiving 2.4.4, and an unnamed link didn't fail
 * 4.1.2, which the profile keeps (#204).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const core = require('../src/index.js');
const { definePack, wcagTags } = require('../src/pack.js');

const UNNAMED_LINK =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x"></a></main></body></html>';
const R244 = 'wcag-2.4.4-link-purpose-in-context';
const R412 = 'wcag-4.1.2-name';

const pack = definePack({
  name: '@city/web-policy',
  title: 'City web policy',
  version: '2026.1.0',
  namespace: 'city',
  core: '*',
  profiles: { 'city-no-244': { tags: wcagTags('2.2'), exclude: { criteria: ['2.4.4', '2.4.9'] } } },
  rollups: [{ id: 'city-images', title: 'Images', checksIds: ['img-alt-present'] }]
});
const WAIVED = { packs: [pack], profile: 'city-no-244' };

function quietly(fn) {
  const { warn, info } = console;
  console.warn = () => {};
  console.info = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
    console.info = info;
  }
}

const scan = (engineOptions, runOnly = null) =>
  quietly(() => runa11yCoreOnHtml(UNNAMED_LINK, { engineOptions, runOnly }));
const ran = (result, id) => result.checksResults.some((c) => c.ruleId === id);
const ids = (result) => result.rulesResults.map((r) => r.ruleId);

test('a rule that also checks a criterion the profile keeps still runs', () => {
  const result = scan(WAIVED);
  assert.equal(result.engine.profile, 'city-no-244');
  assert.deepEqual(result.engine.profileExcludes, { rules: [], criteria: ['2.4.4', '2.4.9'] });
  // link-name-present checks 2.4.4, 2.4.9 and 4.1.2; link-name-quality, 2.4.4
  // and 2.4.9 alone.
  assert.equal(ran(result, 'link-name-present'), true);
  assert.equal(ran(result, 'link-name-quality'), false);
  assert.equal(ids(result).includes(R244), false);
  const name = result.rulesResults.find((r) => r.ruleId === R412);
  assert.equal(name.outcome, 'fail');
  const link = name.data.details.contributors.find((c) => c.testId === 'link-name-present');
  assert.equal(link.outcome, 'fail');
});

test('the catalog agrees with the scan under the profile', () => {
  const checks = quietly(() => core.getChecksForRunOnly(null, WAIVED)).map((c) => c.ruleId);
  assert.ok(checks.includes('link-name-present'));
  assert.equal(checks.includes('link-name-quality'), false);
  const result = scan(WAIVED);
  assert.deepEqual(checks.sort(), result.checksResults.map((c) => c.ruleId).sort());
  assert.deepEqual(
    quietly(() => core.getRulesForRunOnly(null, WAIVED)).map((r) => r.id),
    ids(result)
  );
  const catalog = quietly(() => core.getRulesCatalog(WAIVED)).map((r) => r.id);
  assert.equal(catalog.includes(R244), false);
  assert.ok(catalog.includes(R412));
});

test("a caller's rollup id still excludes the rollup's rules", () => {
  const result = scan({}, { excludeRuleIds: [R244] });
  assert.equal(ran(result, 'link-name-present'), false);
  assert.equal(ids(result).includes(R244), false);
});

test("a caller's runOnly can't waive a rollup the way a profile does", () => {
  const result = scan({}, { excludeRollupIds: [R412], excludeTags: ['best-practice'] });
  assert.ok(ids(result).includes(R412));
});
