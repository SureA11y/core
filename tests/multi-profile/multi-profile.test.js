'use strict';

// A scan of several profiles at once (engineOptions.profile as a list,
// docs/MULTI_PROFILE_SCANS.md): each profile judges the page as a scan of it
// alone would, and the result reads as one profile with the rules of all.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { coercedResult } = require('../../src/scan-result.js');
const { mergeProfileResults } = require('../../src/core/multi-profile.js');

// A standard certain where WCAG asks: an unnamed grid fails its N1.
const std = ruleMappedStandard({
  standard: 'Names Standard',
  tag: 'names',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements: { '1.0': { N1: { title: 'Roles that require a name have one', wcagSc: [] } } },
  ruleMap: {
    '1.0': {
      'aria-role-name-present': {
        requirements: ['N1'],
        reasonCodes: { name_missing: { outcome: 'fail' }, name_internals: { requirements: [] } }
      }
    }
  }
});
const pack = definePack({
  name: 'names-pack',
  version: '1.0.0',
  namespace: 'names',
  core: '*',
  standard: {
    key: 'names',
    standard: 'Names Standard',
    versions: ['1.0'],
    profiles: { 'names-1.0': { version: '1.0', tags: ['names'], mappedRules: true } },
    ruleTag: 'names',
    ruleMapped: true,
    mappingsFor: std.mappingsFor,
    composites: std.composites,
    validate: std.validate
  }
});

const PAGE = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>
  <div role="grid"><div role="row"><div role="gridcell">1</div></div></div>
  <img src="a.png">
</main></body></html>`;
const scan = (engineOptions) =>
  runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack], ...engineOptions } });
const check = (r, id) => r.checksResults.find((c) => c.ruleId === id);
const rollup = (r, id) => r.rulesResults.find((x) => x.ruleId === id);
const BOTH = { profile: ['wcag22-aa', 'names-1.0'] };

test('one name, or a list of one, scans as it always has', () => {
  const plain = scan({ profile: 'wcag22-aa' });
  const one = scan({ profile: ['wcag22-aa'] });
  assert.equal(plain.engine.profile, 'wcag22-aa');
  assert.equal(plain.engine.profiles, undefined);
  assert.equal(plain.profiles, undefined);
  for (const r of [plain, one]) {
    assert.equal(check(r, 'aria-role-name-present').verdicts, undefined);
  }
  assert.deepEqual(
    one.checksResults.map((c) => [c.ruleId, c.outcome]),
    plain.checksResults.map((c) => [c.ruleId, c.outcome])
  );
  assert.deepEqual(
    one.rulesResults.map((c) => [c.ruleId, c.outcome]),
    plain.rulesResults.map((c) => [c.ruleId, c.outcome])
  );
});

test('each finding says what each profile makes of it, and counts as the worst', () => {
  const r = scan(BOTH);
  const grid = check(r, 'aria-role-name-present');
  assert.deepEqual(grid.verdicts, { 'wcag22-aa': 'cantTell', 'names-1.0': 'fail' });
  assert.equal(grid.outcome, 'fail');
  assert.equal(grid.outcomeNormalized, 'fail');
  assert.equal(grid.occurrences.length, 1);
  assert.deepEqual(grid.occurrences[0].verdicts, { 'wcag22-aa': 'cantTell', 'names-1.0': 'fail' });
  // A rule only one profile runs has that profile's verdict alone.
  const img = check(r, 'img-alt-present');
  assert.deepEqual(img.verdicts, { 'wcag22-aa': 'fail' });
});

test("each profile's rollups are as a scan of it alone gives them", () => {
  const r = scan(BOTH);
  const wcag = scan({ profile: 'wcag22-aa' });
  const names = scan({ profile: 'names-1.0' });
  for (const alone of [wcag, names]) {
    for (const x of alone.rulesResults) {
      assert.equal(rollup(r, x.ruleId).outcome, x.outcome, x.ruleId);
    }
  }
  assert.equal(rollup(r, 'wcag-4.1.2-name').outcome, 'cantTell');
  assert.equal(rollup(r, 'names-1.0-N1').outcome, 'fail');
  assert.deepEqual(rollup(r, 'names-1.0-N1').profiles, ['names-1.0']);
  assert.equal(r.profiles['names-1.0'].rulesResults['names-1.0-N1'], 'fail');
  assert.equal(r.profiles['wcag22-aa'].rulesResults['wcag-4.1.2-name'], 'cantTell');
});

test('the engine names every profile, the first as engine.profile', () => {
  const r = scan(BOTH);
  assert.equal(r.engine.profile, 'wcag22-aa');
  assert.deepEqual(r.engine.profiles, ['wcag22-aa', 'names-1.0']);
  assert.equal(r.engine.profilesNotRun, undefined);
  assert.deepEqual(r.engine.packs, ['names-pack@1.0.0']);
});

test('a profile asked for and not run is listed, and judges nothing', () => {
  const r = scan({ profile: ['wcag22-aa', 'names-1.0', 'nowhere-1.0'] });
  assert.deepEqual(r.engine.profiles, ['wcag22-aa', 'names-1.0']);
  assert.deepEqual(r.engine.profilesNotRun, [
    { profile: 'nowhere-1.0', reason: 'unknown-profile' }
  ]);
  assert.equal(r.profiles['nowhere-1.0'], undefined);
});

test('a merged result read back stays as it was', () => {
  const r = JSON.parse(JSON.stringify(scan(BOTH)));
  const read = coercedResult(r);
  assert.equal(check(read, 'aria-role-name-present').outcome, 'fail');
  assert.equal(rollup(read, 'wcag-4.1.2-name').outcome, 'cantTell');
});

test('the same profile twice is one profile', () => {
  const r = scan({ profile: ['wcag22-aa', 'wcag22-aa'] });
  assert.equal(r.engine.profiles, undefined);
  assert.equal(r.engine.profile, 'wcag22-aa');
});

test('strictOptions takes a list of profiles', () => {
  assert.doesNotThrow(() => scan({ ...BOTH, strictOptions: true }));
});

test('a finding a profile does not count is notApplicable there, and its check a pass', () => {
  const finding = (code) => ({
    selector: 'div',
    html: '<div role="grid">',
    data: { details: { reasonCode: code } }
  });
  const result = (profile, outcome, findingOutcomes) => ({
    engine: { profile },
    checksResults: [{ ruleId: 'r', outcome, occurrences: [finding('x')] }],
    rulesResults: [
      {
        ruleId: `${profile}-R`,
        outcome: findingOutcomes ? 'pass' : outcome,
        data: {
          details: {
            contributors: [
              findingOutcomes
                ? { testId: 'r', outcome: 'pass', byReasonCode: true, findingOutcomes }
                : { testId: 'r', outcome }
            ]
          }
        }
      }
    ]
  });
  const merged = mergeProfileResults([
    { profile: 'a', result: result('a', 'cantTell') },
    { profile: 'b', result: result('b', 'cantTell', [null]) }
  ]);
  const c = merged.checksResults[0];
  assert.deepEqual(c.verdicts, { a: 'cantTell', b: 'pass' });
  assert.deepEqual(c.occurrences[0].verdicts, { a: 'cantTell', b: 'notApplicable' });
  assert.equal(c.outcome, 'cantTell');
});

test('SARIF and JUnit treat a profile asked for and not run as an error, unless allowed', () => {
  const { renderSarifReport } = require('../../src/sarif.js');
  const { renderJunitReport } = require('../../src/junit.js');
  const r = scan({ profile: ['wcag22-aa', 'nowhere-1.0'] });
  const sarif = JSON.parse(renderSarifReport(r));
  const inv = sarif.runs[0].invocations[0];
  assert.equal(inv.executionSuccessful, false);
  assert.ok(
    inv.toolExecutionNotifications.some(
      (n) => n.level === 'error' && /nowhere-1\.0/.test(n.message.text)
    )
  );
  const allowed = JSON.parse(renderSarifReport(r, { allowProfilesNotRun: true })).runs[0]
    .invocations[0];
  assert.equal(allowed.executionSuccessful, true);
  assert.match(
    renderJunitReport(r),
    /<testsuite name="Profiles" tests="1" failures="0" errors="1"/
  );
  assert.match(
    renderJunitReport(r, { allowProfilesNotRun: true }),
    /<skipped message="Not run: unknown-profile"\/>/
  );
  assert.throws(() => renderJunitReport(r, { allowProfilesNotRun: 'yes' }), TypeError);
  // A scan of every profile it asked for is no error.
  const ok = JSON.parse(renderSarifReport(scan(BOTH))).runs[0];
  assert.ok(!ok.invocations || ok.invocations[0].executionSuccessful === true);
});
