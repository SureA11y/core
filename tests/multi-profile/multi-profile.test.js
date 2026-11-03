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

// The catalog of a scan of several profiles lists what that scan runs
// (docs/BUILDING_ON_CORE.md): the rules and rollups of each profile, and the
// requirements of each profile's standard.
test('the catalog of a list of profiles is what a scan of them runs', () => {
  const core = require('../../src/index.js');
  const ids = (list) => list.map((x) => x.ruleId || x.id).sort();
  for (const profile of [
    ['wcag22-aa', 'names-1.0'],
    ['Names-1.0 ', 'wcag22-aa', 'nope'],
    ['nope', 'names-1.0']
  ]) {
    const eo = { packs: [pack], profile };
    const r = scan({ profile });
    assert.deepEqual(
      ids(core.getChecksForRunOnly(undefined, eo)),
      ids(r.checksResults),
      JSON.stringify(profile)
    );
    assert.deepEqual(
      ids(core.getRulesForRunOnly(undefined, eo)),
      ids(r.rulesResults),
      JSON.stringify(profile)
    );
    const standards = (list) => Array.from(new Set(list.map((m) => m.standard))).sort();
    assert.deepEqual(
      standards(core.getCheckDefById('aria-role-name-present', eo).normativeMappings),
      standards(check(r, 'aria-role-name-present').meta.normativeMappings),
      JSON.stringify(profile)
    );
  }
  // Each profile's own rules and rollups are in it.
  const both = { packs: [pack], ...BOTH };
  const listed = ids(core.getRulesForRunOnly(undefined, both));
  assert.ok(listed.some((id) => /^names/.test(id)));
  assert.ok(listed.some((id) => /^wcag-/.test(id)));
  assert.ok(ids(core.getRulesCatalog(both)).some((id) => /^names/.test(id)));
  assert.ok(
    !ids(core.getRulesCatalog({ packs: [pack], profile: 'wcag22-aa' })).some((id) =>
      /^names/.test(id)
    )
  );
});

test('in a page, a name no skipped pack may have is an unknown profile', (t) => {
  const { JSDOM } = require('jsdom');
  const main = require('../../src/index.js');
  const { packScript } = require('../../src/pack.js');
  const inPage = (engineOptions) => {
    const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    const warn = console.warn;
    console.warn = () => {};
    try {
      return main.runa11yCoreInPage('https://example.test/', null, engineOptions);
    } finally {
      console.warn = warn;
      dom.window.close();
    }
  };
  // The scans above registered their packs in this process, as a page does.
  const KEY = Symbol.for('surea11y.packs');
  const saved = globalThis[KEY];
  delete globalThis[KEY];
  t.after(() => {
    delete globalThis[KEY];
    if (saved) Object.defineProperty(globalThis, KEY, { value: saved, configurable: true });
  });
  // Not registered: its namespace is all there is to go by.
  const r = inPage({ packs: ['names-pack@1.0.0'], profile: ['nope', 'wcag22-aa', 'names-1.0'] });
  assert.deepEqual(r.engine.profiles, ['wcag22-aa']);
  assert.deepEqual(r.engine.profilesNotRun, [
    { profile: 'nope', reason: 'unknown-profile' },
    { profile: 'names-1.0', reason: 'pack-skipped' }
  ]);
  // Registered in another set: the profiles it declares.
  const zed = definePack({
    name: '@acme/policy',
    version: '1.0.0',
    namespace: 'zed',
    core: '*',
    profiles: { 'zed-1.0': { tags: ['wcag2a'] } },
    rollups: [{ id: 'zed-1', title: 'One', checksIds: ['img-alt-present'] }]
  });
  new Function(packScript([zed]))();
  try {
    const skipped = inPage({
      packs: ['@acme/policy@1.0.0', 'names-pack@1.0.0'],
      profile: ['wcag22-aa', 'zed-1.0', 'other-1.0']
    });
    assert.deepEqual(skipped.engine.profilesNotRun, [
      { profile: 'zed-1.0', reason: 'pack-skipped' },
      { profile: 'other-1.0', reason: 'unknown-profile' }
    ]);
  } finally {
    delete globalThis[KEY];
  }
});

test('the HTML report gives each version of a standard its own table', () => {
  const { renderHtmlReport } = require('../../src/report.js');
  const versions = ['1.0', '2.0'];
  const two = ruleMappedStandard({
    standard: 'Versioned Standard',
    tag: 'vers',
    versions: versions.map((version) => ({ version, wcagVersion: '2.2' })),
    requirements: Object.fromEntries(
      versions.map((v) => [v, { N1: { title: 'Roles that require a name have one', wcagSc: [] } }])
    ),
    ruleMap: Object.fromEntries(
      versions.map((v) => [
        v,
        {
          'aria-role-name-present': {
            requirements: ['N1'],
            reasonCodes: { name_missing: { outcome: 'fail' } }
          }
        }
      ])
    )
  });
  const versioned = definePack({
    name: 'vers-pack',
    version: '1.0.0',
    namespace: 'vers',
    core: '*',
    standard: {
      key: 'vers',
      standard: 'Versioned Standard',
      versions,
      profiles: Object.fromEntries(
        versions.map((v) => [`vers-${v}`, { version: v, tags: ['vers'], mappedRules: true }])
      ),
      ruleTag: 'vers',
      ruleMapped: true,
      mappingsFor: two.mappingsFor,
      composites: two.composites,
      validate: two.validate
    }
  });
  const run = (profile) =>
    runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [versioned], profile } });
  const headings = (html) =>
    [...html.matchAll(/<h2 id="standard-rollup-\d+">([^<]*)<\/h2>/g)].map((m) => m[1]);
  const rowsOf = (html, i) =>
    (
      html
        .split(`id="standard-rollup-${i}"`)[1]
        .split('<h2')[0]
        .match(/<td class="sc-cell">[^<]*/g) || []
    ).map((td) => td.replace('<td class="sc-cell">', ''));
  const both = renderHtmlReport(run(['vers-2.0', 'vers-1.0']));
  assert.deepEqual(headings(both), [
    'Versioned Standard 1.0 rollup',
    'Versioned Standard 2.0 rollup'
  ]);
  assert.deepEqual(rowsOf(both, 0), ['Versioned Standard 1.0 N1']);
  assert.deepEqual(rowsOf(both, 1), ['Versioned Standard 2.0 N1']);
  // One version is one table, as before.
  const one = renderHtmlReport(run('vers-1.0'));
  assert.deepEqual(headings(one), ['Versioned Standard rollup']);
  assert.deepEqual(rowsOf(one, 0), ['Versioned Standard N1']);
});

test('SARIF and JUnit name every profile of a scan of several', () => {
  const { renderSarifReport } = require('../../src/sarif.js');
  const { renderJunitReport } = require('../../src/junit.js');
  const r = scan({ profile: ['wcag22-aa', 'names-1.0'] });
  const props = JSON.parse(renderSarifReport(r)).runs[0].properties;
  assert.equal(props.profile, 'wcag22-aa');
  assert.deepEqual(props.profiles, ['wcag22-aa', 'names-1.0']);
  const junit = renderJunitReport(r);
  assert.match(junit, /<property name="profile" value="wcag22-aa"\/>/);
  assert.match(junit, /<property name="profiles" value="wcag22-aa,names-1\.0"\/>/);
  // One profile is named as before, with no list.
  const one = scan({ profile: 'wcag22-aa' });
  assert.equal(JSON.parse(renderSarifReport(one)).runs[0].properties.profiles, undefined);
  assert.doesNotMatch(renderJunitReport(one), /name="profiles"/);
});
