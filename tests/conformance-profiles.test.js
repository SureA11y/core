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
  for (const profile of ['wcag21-aa', 'wcag99-aa', ['wcag22-aa', 'wcag20-a']]) {
    assert.throws(
      () => scan({ strictOptions: true, profile }),
      (err) => {
        assert.equal(err.code, 'INVALID_ENGINE_OPTIONS');
        assert.match(err.message, /no profile named "wcag(21-aa|99-aa|20-a)"/);
        for (const known of ['wcag22-a', 'wcag22-aa', 'wcag22-aaa', 'section508'])
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
    () => core.runDomRulesInPage(null, null, { strictOptions: true, profile: 'wcag21-aa' }),
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
      engineOptions: { profile: 'section508' },
      runOnly: { includeRuleIds: ['img-alt-present'] }
    })
  );
  assert.equal('profile' in value.engine, false);
  assert.deepEqual(ids(value.checksResults), ['img-alt-present']);
  assert.ok(warnings.some((w) => w.includes('"section508"')));
});

test('a runOnly that only excludes narrows the profile instead of replacing it', () => {
  // What a binding sends for .options({ profile }).disableTags('best-practice').
  const { value, warnings } = captureWarnings(() =>
    runa11yCoreOnHtml(HTML, {
      engineOptions: { profile: 'section508' },
      runOnly: { excludeTags: ['wcag111'] }
    })
  );
  assert.equal(value.engine.profile, 'section508');
  assert.equal(value.engine.wcagVersion, '2.0');
  assert.deepEqual(
    ids(value.checksResults),
    ids(core.getChecksForRunOnly({ tags: PROFILES.section508.tags, excludeTags: ['wcag111'] }))
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
    profile: 'section508',
    tags: { exclude: 'wcag111' }
  });
  assert.ok(excluded.length > 0);
  assert.ok(excluded.every((r) => !r.tags.includes('wcag111')));
  assert.ok(excluded.length < core.getChecksForRunOnly(null, { profile: 'section508' }).length);
});

test('an explicit wcagVersion still wins over the version a profile implies', () => {
  const result = scan({ profile: 'section508', wcagVersion: '2.2' });
  assert.equal(result.engine.profile, 'section508');
  assert.equal(result.engine.wcagVersion, '2.2');
});
