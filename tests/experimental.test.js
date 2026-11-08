'use strict';

/**
 * Core's experimental APIs (src/experimental.js, docs/API_STABILITY.md,
 * "Experimental"): each is listed with the version that brought it and the
 * one by which it becomes stable or is removed, at most two minors later;
 * a release can't ship one past that date; and a pack that uses one is told
 * when its core range would take a minor that may change it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { EXPERIMENTAL, experimentalUses } = require('../src/experimental.js');
const { checkPack, describePacks } = require('../src/pack.js');
const { version: CORE_VERSION } = require('../package.json');
const sample = require('./fixtures/packs/sample.js');

const parse = (v) => String(v).split(/[-+]/)[0].split('.').map(Number);
const [MAJOR, MINOR] = parse(CORE_VERSION);
const TILDE = `~${MAJOR}.${MINOR}.0`;

// Lists an experimental API the sample pack uses, for the test's length.
function withEntry(fn) {
  const entry = {
    id: 'test.sampleFeature',
    since: `${MAJOR}.${MINOR}.0`,
    until: `${MAJOR}.${MINOR + 2}.0`,
    what: 'An API only this test lists.',
    usedBy: (pack) => !!pack && pack.namespace === sample.namespace
  };
  EXPERIMENTAL.push(entry);
  try {
    return fn(entry);
  } finally {
    EXPERIMENTAL.splice(EXPERIMENTAL.indexOf(entry), 1);
  }
}

const RANGE_PROBLEM = /may change the experimental test\.sampleFeature it uses/;

test('each experimental API says what it is, when it came and by when it is settled', () => {
  const ids = new Set();
  for (const entry of EXPERIMENTAL) {
    assert.equal(typeof entry.id, 'string', JSON.stringify(entry));
    assert.ok(!ids.has(entry.id), `${entry.id} is listed twice`);
    ids.add(entry.id);
    assert.ok(typeof entry.what === 'string' && entry.what.trim(), `${entry.id}: what`);
    assert.match(entry.since, /^\d+\.\d+\.0$/, `${entry.id}: since is a minor's version`);
    assert.match(entry.until, /^\d+\.\d+\.0$/, `${entry.id}: until is a minor's version`);
    const [sMajor, sMinor] = parse(entry.since);
    const [uMajor, uMinor] = parse(entry.until);
    // Two minors at most, or the next major.
    const inTwoMinors = uMajor === sMajor && uMinor > sMinor && uMinor - sMinor <= 2;
    const nextMajor = uMajor === sMajor + 1 && uMinor === 0;
    assert.ok(
      inTwoMinors || nextMajor,
      `${entry.id}: until ${entry.until} is too far from ${entry.since}`
    );
  }
});

test('no release ships an experimental API on or past the version that settles it', () => {
  for (const entry of EXPERIMENTAL) {
    const [uMajor, uMinor] = parse(entry.until);
    const due = MAJOR > uMajor || (MAJOR === uMajor && MINOR >= uMinor);
    assert.ok(
      !due,
      `${entry.id} came in ${entry.since} and was to be made stable or removed by ${entry.until}; this is ${CORE_VERSION}`
    );
  }
});

test('a pack that uses an experimental API is told when its range takes the next minor', () => {
  withEntry(() => {
    for (const core of [`^${MAJOR}.${MINOR}.0`, `>=${MAJOR}.${MINOR}.0`, `${MAJOR}.x`, '*']) {
      const problems = checkPack({ ...sample, core });
      assert.ok(
        problems.some((p) => RANGE_PROBLEM.test(p)),
        `${core}: ${problems.join('\n')}`
      );
      assert.ok(
        problems.some((p) => p.includes(`declare "${TILDE}"`)),
        core
      );
    }
    for (const core of [
      TILDE,
      `${MAJOR}.${MINOR}.x`,
      `>=${MAJOR}.${MINOR}.0 <${MAJOR}.${MINOR + 1}.0`
    ]) {
      assert.deepEqual(checkPack({ ...sample, core }), [], core);
    }
  });
});

test('the range is reported, not refused: the pack still loads', () => {
  withEntry(() => {
    const [described] = describePacks([{ ...sample, core: `^${MAJOR}.${MINOR}.0` }]);
    assert.equal(described.problems, undefined, JSON.stringify(described.problems));
  });
});

test('describePacks lists the experimental APIs a pack uses, and nothing for one that uses none', () => {
  withEntry((entry) => {
    const [described] = describePacks([{ ...sample, core: TILDE }]);
    assert.deepEqual(described.experimental, [
      { id: entry.id, since: entry.since, until: entry.until }
    ]);
    assert.deepEqual(experimentalUses({ ...sample, namespace: 'other' }), []);
  });
  const [plain] = describePacks([sample]);
  assert.equal('experimental' in plain, false);
});

test('a pack that uses none is not held to a narrow range', () => {
  assert.deepEqual(experimentalUses(sample), []);
  assert.deepEqual(checkPack({ ...sample, core: `^${MAJOR}.${MINOR}.0` }), []);
});

test('an entry whose check throws counts as unused', () => {
  const entry = {
    id: 'test.throws',
    since: `${MAJOR}.${MINOR}.0`,
    until: `${MAJOR}.${MINOR + 1}.0`,
    what: 'Throws.',
    usedBy: () => {
      throw new Error('no');
    }
  };
  EXPERIMENTAL.push(entry);
  try {
    assert.deepEqual(experimentalUses(sample), []);
  } finally {
    EXPERIMENTAL.splice(EXPERIMENTAL.indexOf(entry), 1);
  }
});

// The entries 1.16 lists, each detected from what a pack holds.
const { definePack, ruleMappedStandard } = require('../src/pack.js');

function skipPack(row) {
  const std = ruleMappedStandard({
    standard: 'Skip Standard',
    tag: 'skipstd',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: {
      '1.0': {
        S1: { title: 'Skip links work', wcagSc: ['2.4.1'] },
        S2: { title: 'Skip links are there', wcagSc: ['2.4.1'] }
      }
    },
    ruleMap: { '1.0': { 'skip-link': row } }
  });
  return definePack({
    name: 'skip-pack',
    version: '1.0.0',
    namespace: 'skipstd',
    core: TILDE,
    standard: {
      key: 'skipstd',
      standard: 'Skip Standard',
      versions: ['1.0'],
      profiles: { 'skipstd-1.0': { version: '1.0', tags: ['skipstd'], mappedRules: true } },
      ruleTag: 'skipstd',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  });
}

const ids = (pack) => experimentalUses(pack).map((u) => u.id);

test("routing skip-link's findings by their lean uses an experimental field", () => {
  const byLean = skipPack({
    requirements: ['S1'],
    findings: [{ when: { lean: 'fail' }, requirements: ['S2'] }]
  });
  assert.deepEqual(ids(byLean), ['skip-link details.lean']);
  // By the row alone, it doesn't.
  assert.deepEqual(ids(skipPack({ requirements: ['S1'] })), []);
});

test("translating a standard's own steps uses experimental dictionary keys", () => {
  const pack = { ...sample, core: TILDE };
  assert.deepEqual(ids(pack), []);
  const translated = {
    ...pack,
    dictionaries: {
      ...pack.dictionaries,
      fr: { 'sample_standardReview_aria-valid-attr-value_ARIA_HASPOPUP_ROLE_MISMATCH_pass': 'x' }
    }
  };
  assert.deepEqual(ids(translated), ['standard.review dictionary keys']);
});

test('the experimental APIs of 1.16 are settled by 1.18.0', () => {
  const listed = Object.fromEntries(EXPERIMENTAL.map((e) => [e.id, [e.since, e.until]]));
  assert.deepEqual(listed['skip-link details.lean'], ['1.16.0', '1.18.0']);
  assert.deepEqual(listed['standard.review dictionary keys'], ['1.16.0', '1.18.0']);
});
