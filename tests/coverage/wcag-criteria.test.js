'use strict';

/**
 * The WCAG criterion table (src/coverage/wcag-criteria.js): every WCAG 2
 * success criterion, with its level in each version that has it. Checked
 * against what WCAG 2.1 and 2.2 publish ("Comparison with WCAG 2.0" and
 * "Comparison with WCAG 2.1"), and against the engine's other tables, which
 * must say the same.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../src/core');
const { WCAG_CRITERIA, WCAG_VERSIONS } = require('../../src/coverage/wcag-criteria');
const { FACETS } = require('../../src/coverage/wcag-facets');
const { introducedInVersion, removedInVersion } = require('../../src/coverage/wcag-version-map');
const wcag = require('../../src/wcag');

const bySc = Object.fromEntries(WCAG_CRITERIA.map((c) => [c.sc, c]));

test('WCAG 2.0 has 61 criteria, 2.1 adds 17 and 2.2 adds 9 and removes 4.1.1', () => {
  const added = (v) => WCAG_CRITERIA.filter((c) => c.introduced === v).map((c) => c.sc);
  assert.equal(added('2.0').length, 61);
  assert.equal(added('2.1').length, 17);
  assert.deepEqual(added('2.2'), [
    '2.4.11',
    '2.4.12',
    '2.4.13',
    '2.5.7',
    '2.5.8',
    '3.2.6',
    '3.3.7',
    '3.3.8',
    '3.3.9'
  ]);
  assert.deepEqual(
    WCAG_CRITERIA.filter((c) => c.removed).map((c) => [c.sc, c.removed]),
    [['4.1.1', '2.2']]
  );
  assert.deepEqual(
    WCAG_VERSIONS.map((v) => WCAG_CRITERIA.filter((c) => c.levels[v]).length),
    [61, 78, 86]
  );
});

test('a criterion has a level in each version from the one that added it, until one removed it', () => {
  for (const c of WCAG_CRITERIA) {
    for (const v of WCAG_VERSIONS) {
      const inForce =
        WCAG_VERSIONS.indexOf(v) >= WCAG_VERSIONS.indexOf(c.introduced) &&
        !(c.removed && WCAG_VERSIONS.indexOf(v) >= WCAG_VERSIONS.indexOf(c.removed));
      assert.equal(!!c.levels[v], inForce, `${c.sc} in ${v}`);
      if (inForce) assert.ok(['A', 'AA', 'AAA'].includes(c.levels[v]), `${c.sc} in ${v}`);
    }
  }
});

test('levels per version: 2.4.7 is AA in every version, 4.1.1 is A until 2.2 removed it', () => {
  assert.deepEqual({ ...bySc['2.4.7'].levels }, { '2.0': 'AA', 2.1: 'AA', 2.2: 'AA' });
  assert.deepEqual({ ...bySc['4.1.1'].levels }, { '2.0': 'A', 2.1: 'A' });
  assert.deepEqual({ ...bySc['2.5.8'].levels }, { 2.2: 'AA' });
});

test('a criterion tag is its number without dots', () => {
  for (const c of WCAG_CRITERIA) assert.equal(c.tag, 'wcag' + c.sc.replace(/\./g, ''));
  assert.equal(bySc['1.4.12'].tag, 'wcag1412');
});

test('the table agrees with the version map and the facets', () => {
  assert.deepEqual(WCAG_CRITERIA.map((c) => c.sc).sort(), Object.keys(FACETS).sort());
  for (const c of WCAG_CRITERIA) {
    assert.equal(c.introduced, introducedInVersion(c.sc), c.sc);
    assert.equal(c.removed, removedInVersion(c.sc), c.sc);
    if (!c.removed) assert.equal(c.levels['2.2'], FACETS[c.sc].level, c.sc);
  }
});

test('wcagCriteria reads each version from the table', () => {
  for (const v of WCAG_VERSIONS) {
    assert.deepEqual(
      wcag.wcagCriteria(v).map((c) => [c.sc, c.level, c.introduced]),
      WCAG_CRITERIA.filter((c) => c.levels[v])
        .map((c) => [c.sc, c.levels[v], c.introduced])
        .sort((a, b) => {
          const pa = a[0].split('.').map(Number);
          const pb = b[0].split('.').map(Number);
          return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
        })
    );
  }
  assert.equal(wcag.WCAG_CRITERIA, WCAG_CRITERIA);
});

test('every criterion tag a rule carries is in the table', () => {
  const tags = new Set(WCAG_CRITERIA.map((c) => c.tag));
  for (const def of core.CHECK_DEFS) {
    for (const t of def.tags || []) {
      if (/^wcag\d{3,4}$/.test(t)) assert.ok(tags.has(t), `${def.ruleId}: ${t}`);
    }
  }
});
