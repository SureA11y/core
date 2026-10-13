'use strict';

/**
 * A standard's own rollups for the checks a scan selects
 * (docs/CRITERIA_FOR_SELECTED_CHECKS.md): added, like a WCAG criterion, when
 * a rule the scan named on its own groups into one, but only while the
 * standard is in play: its profile applies, or the selection names or unlocks
 * its tag. Run against the engine copy with the sample profile
 * (tests/helpers/sampleEngine.js), which maps img-alt-present to S1 and has a
 * rule of its own, sample-title-length, for S5, in versions 1.0 and 2.0.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const core = requireSample('src/index.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>A page title far longer than the sample standard allows for any page</title></head>' +
  '<body><main><img src="a.png"><h1>Top</h1><h3>Skipped</h3></main></body></html>';

const R111 = 'wcag-1.1.1-non-text-content';

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

const scan = (runOnly, engineOptions = {}) =>
  quietly(() => runa11yCoreOnHtml(PAGE, { engineOptions, runOnly }));
const ids = (result) => result.rulesResults.map((r) => r.ruleId);
const listed = (runOnly, engineOptions) =>
  quietly(() => core.getRulesForRunOnly(runOnly, engineOptions)).map((x) => x.id);

function same(runOnly, engineOptions) {
  const result = scan(runOnly, engineOptions);
  assert.deepEqual(listed(runOnly, engineOptions), ids(result));
  return result;
}

test("a WCAG scan doesn't show the requirements of a standard nobody asked for", () => {
  assert.deepEqual(ids(same({ includeRuleIds: ['img-alt-present'] })), [R111]);
});

test('a standard unlocked by optInRules gets its requirements, in each version', () => {
  const engineOptions = { optInRules: 'sample' };
  assert.deepEqual(ids(same({ includeRuleIds: ['img-alt-present'] }, engineOptions)), [
    R111,
    'sample-1.0-S1',
    'sample-2.0-S1'
  ]);
  const own = same({ includeRuleIds: ['sample-title-length'] }, engineOptions);
  assert.deepEqual(ids(own), ['sample-1.0-S5', 'sample-2.0-S5']);
  assert.ok(own.rulesResults.every((r) => r.outcome === 'fail'));
});

test("the standard's tag puts it in play", () => {
  const result = same({ tags: ['sample'], includeRuleIds: ['img-alt-present'], includeMode: 'or' });
  assert.ok(ids(result).includes(R111));
  assert.ok(ids(result).includes('sample-1.0-S1'));
});

test('a profile that did not apply, or mappings alone, does not put a standard in play', () => {
  const overridden = same({ includeRuleIds: ['img-alt-present'] }, { profile: 'sample-1.0' });
  assert.equal(overridden.engine.profile, undefined);
  assert.deepEqual(ids(overridden), [R111]);
  assert.deepEqual(ids(same({ includeRuleIds: ['img-alt-present'] }, { mappings: ['sample'] })), [
    R111
  ]);
  // Its own rule named by id runs, and its requirement stays out.
  const own = same({ includeRuleIds: ['sample-title-length'] });
  assert.equal(own.checksResults[0].ruleId, 'sample-title-length');
  assert.deepEqual(ids(own), []);
});

test("a standard's profile gets what it got before, and its version only", () => {
  for (const profile of ['sample-1.0', 'sample-2.0']) {
    const result = same(null, { profile });
    for (const r of result.rulesResults) {
      assert.equal(
        r.data.details.contributors.some((c) => c.notSelected),
        false,
        `${profile} ${r.ruleId}`
      );
    }
    const other = profile === 'sample-1.0' ? 'sample-2.0-' : 'sample-1.0-';
    assert.equal(
      ids(result).some((id) => id.startsWith(other)),
      false
    );
  }
});

test('an added rollup names the requirements of the rules that decided it', () => {
  const result = scan(
    { includeRuleIds: ['img-alt-present', 'img-alt-decorative'] },
    { optInRules: 'sample', mappings: ['sample'] }
  );
  const wcag = result.rulesResults.find((r) => r.ruleId === R111);
  assert.equal(wcag.outcome, 'fail');
  const sample = wcag.meta.normativeMappings
    .filter((m) => m.standard === 'Sample Standard')
    .map((m) => m.requirement);
  assert.ok(sample.includes('S1'));
  assert.equal(sample.includes('S3'), false);
});
