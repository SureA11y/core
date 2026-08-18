'use strict';

/**
 * Direct tests for src/coverage/wcag-version-map.js.
 *
 * The sibling wcag-version-tags.test.js proves every shipped rule carries the
 * version tag this module derives -- a whole-catalog consistency guard that
 * only ever feeds it real SCs. This file pins the mapping itself: which SC
 * belongs to which WCAG version, and what happens for input that is not an SC
 * at all. Both matter because the lists here are hand-maintained, and a
 * mis-filed SC would tag a rule for the wrong WCAG version everywhere.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WCAG21_NEW_SCS,
  WCAG22_NEW_SCS,
  introducedInVersion,
  versionTagPrefixForScs
} = require('../../src/coverage/wcag-version-map');

test('introducedInVersion: every listed SC reports the version that introduced it', () => {
  for (const sc of WCAG21_NEW_SCS) assert.equal(introducedInVersion(sc), '2.1', sc);
  for (const sc of WCAG22_NEW_SCS) assert.equal(introducedInVersion(sc), '2.2', sc);
});

test('introducedInVersion: an SC on neither list predates 2.1', () => {
  for (const sc of ['1.1.1', '1.4.3', '2.4.4', '4.1.2']) {
    assert.equal(introducedInVersion(sc), '2.0', sc);
  }
});

test('introducedInVersion: surrounding whitespace does not change the answer', () => {
  assert.equal(introducedInVersion('  2.5.8  '), '2.2');
  assert.equal(introducedInVersion(' 1.3.4 '), '2.1');
});

test('introducedInVersion: anything that is not an SC reads as 2.0, not as an error', () => {
  for (const bad of [null, undefined, '', '   ', 0, {}, [], 'not-an-sc']) {
    assert.equal(introducedInVersion(bad), '2.0', JSON.stringify(bad));
  }
});

test('introducedInVersion: the two lists never disagree about an SC', () => {
  const overlap = WCAG21_NEW_SCS.filter((sc) => WCAG22_NEW_SCS.includes(sc));
  assert.deepEqual(overlap, [], 'an SC cannot have been introduced by two versions');
});

test('versionTagPrefixForScs: the newest version among a rule’s SCs wins', () => {
  assert.equal(versionTagPrefixForScs(['1.1.1']), 'wcag2');
  assert.equal(versionTagPrefixForScs(['1.3.4']), 'wcag21');
  assert.equal(versionTagPrefixForScs(['2.5.8']), 'wcag22');
  assert.equal(versionTagPrefixForScs(['1.1.1', '1.3.4']), 'wcag21');
  assert.equal(versionTagPrefixForScs(['1.1.1', '1.3.4', '2.5.8']), 'wcag22');
});

test('versionTagPrefixForScs: non-string SC entries are compared as strings', () => {
  assert.equal(versionTagPrefixForScs([{ toString: () => '2.5.8' }]), 'wcag22');
});

test('versionTagPrefixForScs: a rule with no SC list at all is plain wcag2', () => {
  for (const bad of [null, undefined, 'x', {}, 3, []]) {
    assert.equal(versionTagPrefixForScs(bad), 'wcag2', JSON.stringify(bad));
  }
});
