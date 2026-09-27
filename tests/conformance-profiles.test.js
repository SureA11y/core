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
  'wcag22-aa': {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
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

test('an unknown profile runs the default selection and warns', () => {
  const { value, warnings } = captureWarnings(() => scan({ profile: 'wcag99-aa' }));
  assert.equal('profile' in value.engine, false);
  assert.deepEqual(ids(value.checksResults), ids(scan({}).checksResults));
  assert.ok(warnings.some((w) => w.includes('"wcag99-aa"') && w.includes('no such profile')));
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

test('a runOnly filter overrides the profile, with a warning', () => {
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
