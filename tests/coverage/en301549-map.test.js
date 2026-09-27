'use strict';

/**
 * Direct tests for src/coverage/en301549-map.js.
 *
 * The table is hand-maintained from the ETSI text, so these pin it against the
 * engine's own WCAG registry: each version must restate exactly the Level A
 * and AA criteria of the WCAG version it is built on, no more and no fewer. A
 * missing row would leave a composite with no clause; an extra one would claim
 * EN 301 549 covers a criterion it does not.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EN301549_VERSIONS,
  EN301549_CLAUSES,
  en301549ClausesForSc
} = require('../../src/coverage/en301549-map');
const { FACETS } = require('../../src/coverage/wcag-facets');
const { introducedInVersion, removedInVersion } = require('../../src/coverage/wcag-version-map');

const VERSION_ORDER = ['2.0', '2.1', '2.2'];

// The WCAG Level A and AA criteria that make up a given WCAG version. 4.1.1
// carries no level in the registry, since 2.2 removed it; it was Level A.
function wcagAAFor(wcagVersion) {
  const max = VERSION_ORDER.indexOf(wcagVersion);
  return Object.keys(FACETS).filter((sc) => {
    if (FACETS[sc].level === 'AAA') return false;
    if (VERSION_ORDER.indexOf(introducedInVersion(sc)) > max) return false;
    const removed = removedInVersion(sc);
    return !(removed && VERSION_ORDER.indexOf(removed) <= max);
  });
}

test('every version has a clause table, and every table a version', () => {
  assert.deepEqual(
    EN301549_VERSIONS.map((v) => v.version).sort(),
    Object.keys(EN301549_CLAUSES).sort()
  );
});

test('each version restates exactly the WCAG A and AA criteria it is built on', () => {
  for (const { version, wcagVersion } of EN301549_VERSIONS) {
    assert.deepEqual(
      Object.keys(EN301549_CLAUSES[version]).sort(),
      wcagAAFor(wcagVersion).sort(),
      version
    );
  }
});

test('the criteria counts match the published WCAG totals', () => {
  assert.equal(Object.keys(EN301549_CLAUSES['V3.2.1']).length, 50);
  assert.equal(Object.keys(EN301549_CLAUSES['V4.1.1']).length, 55);
});

test('every clause is numbered 9. plus its criterion and has a title', () => {
  for (const [version, rows] of Object.entries(EN301549_CLAUSES)) {
    for (const [sc, row] of Object.entries(rows)) {
      assert.equal(row.clause, `9.${sc}`, `${version} ${sc}`);
      assert.ok(row.title && row.title.trim() === row.title, `${version} ${sc}`);
    }
  }
});

test('en301549ClausesForSc: a criterion in both versions gets both, oldest first', () => {
  assert.deepEqual(en301549ClausesForSc('1.4.3'), [
    { version: 'V3.2.1', clause: '9.1.4.3', title: 'Contrast (minimum)' },
    { version: 'V4.1.1', clause: '9.1.4.3', title: 'Contrast (minimum)' }
  ]);
});

test('en301549ClausesForSc: titles follow each version\'s own wording', () => {
  assert.deepEqual(
    en301549ClausesForSc('1.2.2').map((c) => c.title),
    ['Captions (pre-recorded)', 'Subtitles (pre-recorded)']
  );
});

test('en301549ClausesForSc: WCAG 2.2 additions exist only in V4.1.1', () => {
  for (const sc of ['2.4.11', '2.5.7', '2.5.8', '3.2.6', '3.3.7', '3.3.8']) {
    assert.deepEqual(
      en301549ClausesForSc(sc).map((c) => c.version),
      ['V4.1.1'],
      sc
    );
  }
});

test('en301549ClausesForSc: 4.1.1 Parsing exists only in V3.2.1', () => {
  assert.deepEqual(en301549ClausesForSc('4.1.1'), [
    { version: 'V3.2.1', clause: '9.4.1.1', title: 'Parsing' }
  ]);
});

test('en301549ClausesForSc: AAA criteria and non-criteria get no clause', () => {
  for (const sc of ['1.4.6', '2.4.13', '3.3.9', '', null, undefined, '9.9.9']) {
    assert.deepEqual(en301549ClausesForSc(sc), [], String(sc));
  }
});

test('en301549ClausesForSc: surrounding whitespace does not change the answer', () => {
  assert.deepEqual(en301549ClausesForSc(' 2.5.8 '), en301549ClausesForSc('2.5.8'));
});
