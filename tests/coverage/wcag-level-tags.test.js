'use strict';

/**
 * A rule's WCAG version/level tags (wcag2a ... wcag22aaa) follow from the
 * criterion tags it carries (wcag111 ...): for each criterion, the tag of the
 * version that introduced it at the level it has there (the criterion table,
 * src/coverage/wcag-criteria.js). So a rule tagged wcag412 carries wcag2a,
 * 4.1.2 being a Level A criterion of WCAG 2.0, and not wcag2aa.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../src/core');
const { WCAG_CRITERIA } = require('../../src/coverage/wcag-criteria');

const BY_TAG = Object.fromEntries(WCAG_CRITERIA.map((c) => [c.tag, c]));
const PREFIX = { '2.0': 'wcag2', 2.1: 'wcag21', 2.2: 'wcag22' };
const LEVEL_TAG = /^wcag2[12]?a{1,3}$/;

// Rules whose level tags don't follow from their criterion tags, on purpose,
// each with why. Another one fails the test. None today.
const KNOWN = {};

function expectedLevelTags(def) {
  const out = new Set();
  for (const t of def.tags || []) {
    const c = BY_TAG[String(t).toLowerCase()];
    if (c) out.add(PREFIX[c.introduced] + c.levels[c.introduced].toLowerCase());
  }
  return [...out].sort();
}

test("a rule's version/level tags follow from its criterion tags", () => {
  const mismatches = [];
  for (const def of core.CHECK_DEFS) {
    const actual = (def.tags || []).filter((t) => LEVEL_TAG.test(t)).sort();
    const expected = expectedLevelTags(def);
    if (actual.join() === expected.join()) continue;
    if (KNOWN[def.ruleId] && KNOWN[def.ruleId].join() === actual.join()) continue;
    mismatches.push(`${def.ruleId}: carries [${actual}], its criterion tags give [${expected}]`);
  }
  assert.deepEqual(mismatches, []);
});

test('the check catches a level tag that does not match', () => {
  const def = { ruleId: 'x', tags: ['wcag2aa', 'wcag412'] };
  assert.deepEqual(expectedLevelTags(def), ['wcag2a']);
  assert.deepEqual(expectedLevelTags({ tags: ['wcag258'] }), ['wcag22aa']);
  assert.deepEqual(expectedLevelTags({ tags: ['wcag111', 'wcag247'] }), ['wcag2a', 'wcag2aa']);
});

test('every exception is still needed', () => {
  for (const [ruleId, tags] of Object.entries(KNOWN)) {
    const def = core.CHECK_DEFS.find((d) => d.ruleId === ruleId);
    assert.ok(def, ruleId);
    assert.notEqual(expectedLevelTags(def).join(), tags.join(), ruleId);
  }
});
