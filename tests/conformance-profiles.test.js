'use strict';

/**
 * engineOptions.profile: a named conformance target that expands to the
 * version-origin tag set a caller would otherwise spell out by hand, with the
 * WCAG target version following from those tags. These pin what each profile
 * selects, the precedence against the other ways of selecting rules, and that
 * a profile that did not take effect is reported rather than silent.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const PROFILES = {
  'wcag20-a': { tags: ['wcag2a'], wcagVersion: '2.0' },
  'wcag20-aa': { tags: ['wcag2a', 'wcag2aa'], wcagVersion: '2.0' },
  'wcag20-aaa': { tags: ['wcag2a', 'wcag2aa', 'wcag2aaa'], wcagVersion: '2.0' },
  'wcag21-a': { tags: ['wcag2a', 'wcag21a'], wcagVersion: '2.1' },
  'wcag21-aa': { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], wcagVersion: '2.1' },
  'wcag21-aaa': {
    tags: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'],
    wcagVersion: '2.1'
  },
  'wcag22-a': { tags: ['wcag2a', 'wcag21a', 'wcag22a'], wcagVersion: '2.2' },
  'wcag22-aa': {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
    wcagVersion: '2.2'
  },
  'wcag22-aaa': {
    tags: [
      'wcag2a',
      'wcag2aa',
      'wcag2aaa',
      'wcag21a',
      'wcag21aa',
      'wcag21aaa',
      'wcag22a',
      'wcag22aa',
      'wcag22aaa'
    ],
    wcagVersion: '2.2'
  },
  'en301549-v4.1.1': {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
    wcagVersion: '2.2'
  },
  'en301549-v3.2.1': {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    wcagVersion: '2.1'
  },
  section508: { tags: ['wcag2a', 'wcag2aa'], wcagVersion: '2.0' }
};

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"><div id="x"></div><div id="x"></div></main></body></html>';

const ids = (entries) => entries.map((e) => e.ruleId).sort();

// A profile is not an error when it does not apply, but it is announced.
function captureWarnings(fn) {
  const original = console.warn;
  const warnings = [];
  console.warn = (msg) => warnings.push(String(msg));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = original;
  }
}

function scan(engineOptions) {
  return runa11yCoreOnHtml(HTML, { engineOptions });
}

test('each profile selects exactly the rules its tag set selects', () => {
  for (const [name, { tags }] of Object.entries(PROFILES)) {
    assert.deepEqual(
      ids(core.getChecksForRunOnly(null, { profile: name })),
      ids(core.getChecksForRunOnly({ tags })),
      name
    );
  }
});

test('each profile resolves its WCAG target version and is reported on the result', () => {
  for (const [name, { wcagVersion }] of Object.entries(PROFILES)) {
    const result = scan({ profile: name });
    assert.equal(result.engine.profile, name);
    assert.equal(result.engine.wcagVersion, wcagVersion, name);
  }
});

test('a run with no profile carries no engine.profile', () => {
  assert.equal('profile' in scan({}).engine, false);
});

test('profile names are matched case-insensitively', () => {
  assert.equal(scan({ profile: ' EN301549-V4.1.1 ' }).engine.profile, 'en301549-v4.1.1');
});

test('EN 301 549 V3.2.1 keeps 4.1.1 Parsing, V4.1.1 does not', () => {
  const dup = (profile) =>
    scan({ profile }).checksResults.find((r) => r.ruleId === 'duplicate-id').outcome;
  assert.equal(dup('en301549-v3.2.1'), 'fail');
  assert.equal(dup('en301549-v4.1.1'), 'cantTell');
});

test('AAA composites and criteria outside the profile do not run', () => {
  const composites = (profile) => scan({ profile }).rulesResults.map((r) => r.ruleId);
  assert.ok(!composites('wcag22-aa').some((id) => id.startsWith('wcag-1.4.6-')));
  assert.ok(composites('en301549-v4.1.1').some((id) => id.startsWith('wcag-2.5.8-')));
  assert.ok(!composites('en301549-v3.2.1').some((id) => id.startsWith('wcag-2.5.8-')));
});

test('each WCAG level adds to the one below it', () => {
  const selected = (profile) => ids(core.getChecksForRunOnly(null, { profile }));
  const [a, aa, aaa] = ['wcag22-a', 'wcag22-aa', 'wcag22-aaa'].map(selected);
  assert.ok(a.every((id) => aa.includes(id)));
  assert.ok(aa.every((id) => aaa.includes(id)));
  assert.ok(a.length < aa.length && aa.length < aaa.length);
  const composites = (profile) => scan({ profile }).rulesResults.map((r) => r.ruleId);
  assert.ok(!composites('wcag22-a').some((id) => id.startsWith('wcag-1.4.3-')));
  assert.ok(composites('wcag22-aa').some((id) => id.startsWith('wcag-1.4.3-')));
  assert.ok(composites('wcag22-aaa').some((id) => id.startsWith('wcag-1.4.6-')));
});

test('each WCAG 2.0 and 2.1 level adds to the one below it, and 2.1 to 2.0', () => {
  const selected = (profile) => ids(core.getChecksForRunOnly(null, { profile }));
  for (const v of ['20', '21']) {
    const [a, aa, aaa] = ['a', 'aa', 'aaa'].map((l) => selected(`wcag${v}-${l}`));
    assert.ok(
      a.every((id) => aa.includes(id)),
      v
    );
    assert.ok(
      aa.every((id) => aaa.includes(id)),
      v
    );
    assert.ok(a.length < aa.length && aa.length < aaa.length, v);
  }
  assert.ok(selected('wcag20-aa').every((id) => selected('wcag21-aa').includes(id)));
  assert.ok(selected('wcag21-aa').every((id) => selected('wcag22-aa').includes(id)));
  const composites = (profile) => scan({ profile }).rulesResults.map((r) => r.ruleId);
  // 2.5.8 Target Size (Minimum) is new in 2.2, 1.4.10 Reflow in 2.1.
  assert.ok(!composites('wcag21-aa').some((id) => id.startsWith('wcag-2.5.8-')));
  assert.ok(!composites('wcag20-aa').some((id) => id.startsWith('wcag-1.4.10-')));
});

test('a WCAG 2.0 or 2.1 level profile runs exactly what runOnly.wcag runs', () => {
  // Their tags take in 4.1.1 Parsing, as the versions do; under the 2023
  // errata its rule can't fail, as with runOnly.wcag.
  for (const version of ['2.0', '2.1']) {
    for (const level of ['A', 'AA', 'AAA']) {
      const profile = `wcag${version.replace('.', '')}-${level.toLowerCase()}`;
      assert.deepEqual(
        ids(core.getChecksForRunOnly(null, { profile })),
        ids(core.getChecksForRunOnly({ wcag: { version, level } })),
        profile
      );
    }
  }
  const dup = (profile) =>
    scan({ profile }).checksResults.find((r) => r.ruleId === 'duplicate-id').outcome;
  assert.equal(dup('wcag20-aa'), 'cantTell');
  assert.equal(dup('wcag21-aa'), 'cantTell');
});

test('each WCAG profile gives its WCAG target', () => {
  for (const version of ['2.0', '2.1', '2.2']) {
    for (const level of ['A', 'AA', 'AAA']) {
      const profile = `wcag${version.replace('.', '')}-${level.toLowerCase()}`;
      assert.deepEqual(core.getProfileWcagTarget(profile), { version, level }, profile);
      const result = scan({ profile });
      assert.equal(result.engine.wcagVersion, version, profile);
      assert.equal(result.engine.wcagLevel, level, profile);
    }
  }
});

test('section508 is deprecated: it runs as wcag20-aa does, and says so once per process', () => {
  const SLOT = Symbol.for('surea11y.deprecatedProfilesWarned');
  delete globalThis[SLOT];
  const outcomes = (r) =>
    JSON.stringify([
      r.checksResults.map((c) => [c.ruleId, c.outcome]),
      r.rulesResults.map((c) => [c.ruleId, c.outcome])
    ]);
  const { value, warnings } = captureWarnings(() => [
    scan({ profile: 'section508' }),
    scan({ profile: ' SECTION508 ' }),
    scan({ profile: 'wcag20-aa' }),
    // Not an error under strictOptions: it still exists.
    scan({ profile: 'section508', strictOptions: true })
  ]);
  delete globalThis[SLOT];
  assert.equal(value[0].engine.profile, 'section508');
  assert.equal(outcomes(value[0]), outcomes(value[2]));
  const deprecated = warnings.filter((w) => /deprecated/.test(w));
  assert.equal(deprecated.length, 1, deprecated.join('\n'));
  assert.match(deprecated[0], /"section508" is deprecated and goes in 2\.0\.0: use "wcag20-aa"/);
  // A scan that names no deprecated profile leaves no record on the global
  // object, a page's window in a browser.
  scan({ profile: 'wcag20-aa' });
  assert.equal(Object.getOwnPropertySymbols(globalThis).includes(SLOT), false);
});

test('a WCAG level profile runs what runOnly.wcag runs, and 4.1.1 Parsing', () => {
  // As for wcag22-aa: the profile selects by tags, so duplicate-id, tagged
  // wcag2a, runs (and cannot fail under WCAG 2.2); runOnly.wcag leaves it out.
  for (const [profile, level] of [
    ['wcag22-a', 'A'],
    ['wcag22-aa', 'AA'],
    ['wcag22-aaa', 'AAA']
  ]) {
    const byTarget = ids(core.getChecksForRunOnly({ wcag: { version: '2.2', level } }));
    assert.deepEqual(
      ids(core.getChecksForRunOnly(null, { profile })),
      byTarget.concat('duplicate-id').sort(),
      profile
    );
  }
});

test('an unknown profile runs the default selection and warns', () => {
  const { value, warnings } = captureWarnings(() => scan({ profile: 'wcag99-aa' }));
  assert.equal('profile' in value.engine, false);
  assert.deepEqual(ids(value.checksResults), ids(scan({}).checksResults));
  assert.ok(warnings.some((w) => w.includes('"wcag99-aa"') && w.includes('no such profile')));
});

test('under strictOptions, an unknown profile throws and names the profiles there are', () => {
  for (const profile of ['wcag23-aa', 'wcag99-aa', ['wcag22-aa', 'wcag30-a']]) {
    assert.throws(
      () => scan({ strictOptions: true, profile }),
      (err) => {
        assert.equal(err.code, 'INVALID_ENGINE_OPTIONS');
        assert.match(err.message, /no profile named "wcag(23-aa|99-aa|30-a)"/);
        for (const known of ['wcag20-aa', 'wcag21-aa', 'wcag22-a', 'wcag22-aa', 'wcag22-aaa'])
          assert.ok(err.message.includes(known), known);
        assert.ok(err.knownProfiles.includes('wcag22-aa'));
        return true;
      },
      JSON.stringify(profile)
    );
  }
  // A known one, in any case, still runs.
  assert.equal(scan({ strictOptions: true, profile: 'WCAG22-AA' }).engine.profile, 'wcag22-aa');
  // The Node runner too.
  assert.throws(
    () => core.runDomRulesInPage(null, null, { strictOptions: true, profile: 'wcag23-aa' }),
    { code: 'INVALID_ENGINE_OPTIONS' }
  );
});

test('an explicit include in engineOptions overrides the profile, with a warning', () => {
  const { value, warnings } = captureWarnings(() =>
    scan({ profile: 'wcag22-aa', tags: { include: 'wcag111' } })
  );
  assert.equal('profile' in value.engine, false);
  assert.deepEqual(
    ids(value.checksResults),
    ids(core.getChecksForRunOnly(null, { tags: { include: 'wcag111' } }))
  );
  assert.ok(warnings.some((w) => w.includes('"wcag22-aa"') && w.includes('selects the rules')));
});

test('a runOnly include overrides the profile, with a warning', () => {
  const { value, warnings } = captureWarnings(() =>
    runa11yCoreOnHtml(HTML, {
      engineOptions: { profile: 'wcag20-aa' },
      runOnly: { includeRuleIds: ['img-alt-present'] }
    })
  );
  assert.equal('profile' in value.engine, false);
  assert.deepEqual(ids(value.checksResults), ['img-alt-present']);
  assert.ok(warnings.some((w) => w.includes('"wcag20-aa"')));
});

test('a runOnly that only excludes narrows the profile instead of replacing it', () => {
  // What a binding sends for .options({ profile }).disableTags('best-practice').
  const { value, warnings } = captureWarnings(() =>
    runa11yCoreOnHtml(HTML, {
      engineOptions: { profile: 'wcag20-aa' },
      runOnly: { excludeTags: ['wcag111'] }
    })
  );
  assert.equal(value.engine.profile, 'wcag20-aa');
  assert.equal(value.engine.wcagVersion, '2.0');
  assert.deepEqual(
    ids(value.checksResults),
    ids(core.getChecksForRunOnly({ tags: PROFILES['wcag20-aa'].tags, excludeTags: ['wcag111'] }))
  );
  assert.ok(!ids(value.checksResults).includes('img-alt-present'));
  assert.deepEqual(warnings, []);
});

test('a runOnly that only excludes rule ids also keeps the profile', () => {
  const selected = core.getChecksForRunOnly(
    { excludeRuleIds: ['img-alt-present'] },
    { profile: 'wcag22-aa' }
  );
  assert.deepEqual(
    ids(selected),
    ids(
      core.getChecksForRunOnly({
        tags: PROFILES['wcag22-aa'].tags,
        excludeRuleIds: ['img-alt-present']
      })
    )
  );
});

test('excludes still apply on top of a profile', () => {
  const excluded = core.getChecksForRunOnly(null, {
    profile: 'wcag20-aa',
    tags: { exclude: 'wcag111' }
  });
  assert.ok(excluded.length > 0);
  assert.ok(excluded.every((r) => !r.tags.includes('wcag111')));
  assert.ok(excluded.length < core.getChecksForRunOnly(null, { profile: 'wcag20-aa' }).length);
});

test('an explicit wcagVersion still wins over the version a profile implies', () => {
  const result = scan({ profile: 'wcag20-aa', wcagVersion: '2.2' });
  assert.equal(result.engine.profile, 'wcag20-aa');
  assert.equal(result.engine.wcagVersion, '2.2');
});
