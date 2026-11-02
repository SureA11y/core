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

// A standard can fail a finding WCAG only asks about: an attribute the role
// doesn't support is a WCAG question and a failure of the names standard's
// N1 here, mapped the same way. The check's own outcome stays what its WCAG
// criteria read.
test("a check keeps the rule's own outcome, which EARL asserts for its WCAG criteria", () => {
  const attrStd = ruleMappedStandard({
    standard: 'Attr Standard',
    tag: 'attrs',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { A1: { title: 'Attributes are supported', wcagSc: [] } } },
    ruleMap: {
      '1.0': {
        'aria-allowed-attr': {
          requirements: ['A1'],
          reasonCodes: {
            ARIA_ATTR_NOT_ALLOWED: { outcome: 'fail' },
            ARIA_ATTR_NOT_ALLOWED_ROLELESS: { outcome: 'fail' },
            ARIA_ATTR_DEPRECATED: { outcome: 'cantTell' }
          }
        }
      }
    }
  });
  const attrPack = definePack({
    name: 'attrs-pack',
    version: '1.0.0',
    namespace: 'attrs',
    core: '*',
    standard: {
      key: 'attrs',
      standard: 'Attr Standard',
      versions: ['1.0'],
      profiles: { 'attrs-1.0': { version: '1.0', tags: ['attrs'], mappedRules: true } },
      ruleTag: 'attrs',
      ruleMapped: true,
      mappingsFor: attrStd.mappingsFor,
      composites: attrStd.composites,
      validate: attrStd.validate
    }
  });
  const r = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><div role="group" aria-checked="true">Options</div></main></body></html>',
    { engineOptions: { packs: [attrPack], profile: ['wcag22-aa', 'attrs-1.0'] } }
  );
  const check = r.checksResults.find((c) => c.ruleId === 'aria-allowed-attr');
  assert.deepEqual(check.verdicts, { 'wcag22-aa': 'cantTell', 'attrs-1.0': 'fail' });
  assert.equal(check.outcome, 'fail');
  assert.equal(check.checkOutcome, 'cantTell');

  const { renderEarlReport } = require('../../src/earl.js');
  const text = JSON.stringify(renderEarlReport(r));
  const at = text.indexOf('"title":"aria-allowed-attr"');
  assert.ok(at > 0);
  assert.match(text.slice(at, at + 200), /"outcome":"earl:cantTell"/);

  // The HTML report shows each profile's verdict on the card, and every
  // profile in its heading.
  const { renderHtmlReport } = require('../../src/report.js');
  const html = renderHtmlReport(r);
  assert.match(html, /wcag22-aa \+ attrs-1\.0/);
  assert.match(html, />attrs-1\.0: Fail</);
});

test('a single-profile result has no checkOutcome, and EARL reads its outcome as before', () => {
  const r = scan({ profile: 'wcag22-aa' });
  assert.equal(check(r, 'aria-role-name-present').checkOutcome, undefined);
});

test('a runOnly that selects the rules instead leaves every profile unapplied, and says why', () => {
  const r = runa11yCoreOnHtml(PAGE, {
    engineOptions: { packs: [pack], profile: ['wcag22-aa', 'names-1.0'] },
    runOnly: ['img-alt-present']
  });
  assert.deepEqual(r.engine.profiles, []);
  assert.deepEqual(r.engine.profilesNotRun, [
    { profile: 'wcag22-aa', reason: 'overridden-by-selection' },
    { profile: 'names-1.0', reason: 'overridden-by-selection' }
  ]);
  assert.ok(!JSON.stringify(r).includes('__profileNotApplied'));
});

// From a stress test of the merge.

test('two findings of one rule on one element for the same reason are both kept', () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>
    <span aria-checked="true" aria-pressed="true" aria-selected="true">x</span>
    <button aria-pressed="maybe" aria-expanded="perhaps" aria-haspopup="nah">b</button>
  </main></body></html>`;
  const run = (profile) => runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile } });
  for (const id of ['aria-allowed-attr', 'aria-valid-attr-value']) {
    const one = check(run('wcag22-aa'), id).occurrences.length;
    assert.ok(one > 1, `${id} finds several`);
    assert.equal(check(run(['wcag22-aa', 'names-1.0']), id).occurrences.length, one, id);
  }
});

test('names in a list are matched without case, as one name is', () => {
  const r = scan({ profile: ['WCAG22-AA', 'Names-1.0', 'wcag22-aa'] });
  assert.deepEqual(r.engine.profiles, ['wcag22-aa', 'names-1.0']);
  assert.equal(r.engine.profilesNotRun, undefined);
});

test('a profile whose pack was skipped is said to be so', () => {
  const old = { ...pack, core: '^9.0.0' };
  const r = runa11yCoreOnHtml(PAGE, {
    engineOptions: { packs: [old], profile: ['wcag22-aa', 'names-1.0'] }
  });
  assert.deepEqual(r.engine.profilesNotRun, [{ profile: 'names-1.0', reason: 'pack-skipped' }]);
});

test('what each profile says of a rule is kept, whichever is listed first', () => {
  const ab = scan({ profile: ['wcag22-aa', 'names-1.0'] });
  const ba = scan({ profile: ['names-1.0', 'wcag22-aa'] });
  for (const r of [ab, ba]) {
    const c = check(r, 'aria-role-name-present');
    assert.ok(
      c.rollupIds.some((id) => /^wcag-/.test(id)),
      'a WCAG rollup'
    );
    assert.ok(
      c.rollupIds.some((id) => /^names/.test(id)),
      "the standard's rollup"
    );
  }
  assert.deepEqual(
    [...check(ab, 'aria-role-name-present').rollupIds].sort(),
    [...check(ba, 'aria-role-name-present').rollupIds].sort()
  );
  // The WCAG the scan is judged by: the highest level and version asked.
  assert.equal(scan({ profile: ['wcag22-a', 'wcag22-aaa'] }).engine.wcagLevel, 'AAA');
  assert.equal(scan({ profile: ['section508', 'wcag22-aa'] }).engine.wcagVersion, '2.2');
});

test('the HTML report names a profile asked for and not run', () => {
  const { renderHtmlReport } = require('../../src/report.js');
  const r = scan({ profile: ['wcag22-aa', 'nope-1.0'] });
  assert.match(renderHtmlReport(r), /<b>nope-1\.0<\/b>not run/);
});
