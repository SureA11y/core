'use strict';

/**
 * What a release published stays published: every rule id and reason code in
 * scripts/data/released-finding-ids.json, frozen at the last release, is still
 * in today's inventories, or is listed under `retired` with the reason it went
 * (docs/API_STABILITY.md, "Finding identity").
 *
 * tests/finding-ids.test.js compares the inventories with a fresh generation,
 * so a commit that drops an identity and regenerates them in one go passes it.
 * This test compares with the release instead, which no commit rewrites.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ruleSources } = require('../scripts/lib/rule-dirs');

const RELEASED = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'scripts', 'data', 'released-finding-ids.json'),
    'utf8'
  )
);
const current = ruleSources().map((src) =>
  JSON.parse(fs.readFileSync(path.join(src.dataDir, 'finding-ids.json'), 'utf8'))
);
const RULE_IDS = new Set(current.flatMap((inv) => inv.ruleIds));
const CODES = new Set(
  current.flatMap((inv) =>
    Object.entries(inv.reasonCodes).flatMap(([id, codes]) => codes.map((c) => `${id}/${c}`))
  )
);
const { retired } = RELEASED;
const hasReason = (why) => typeof why === 'string' && why.trim().length > 0;

test(`every rule id ${RELEASED.version} shipped is still there, or retired with a reason`, () => {
  const missing = RELEASED.ruleIds.filter(
    (id) => !RULE_IDS.has(id) && !hasReason(retired.ruleIds[id])
  );
  assert.deepEqual(
    missing,
    [],
    'keep the rule (deprecated, if it is going: docs/API_STABILITY.md), or list it under retired.ruleIds with the reason'
  );
});

test(`every reason code ${RELEASED.version} shipped is still there, or retired with a reason`, () => {
  const missing = Object.entries(RELEASED.reasonCodes)
    .flatMap(([id, codes]) => codes.map((c) => `${id}/${c}`))
    .filter((key) => !CODES.has(key))
    .filter((key) => !hasReason(retired.reasonCodes[key]))
    .filter((key) => !hasReason(retired.ruleIds[key.split('/')[0]]));
  assert.deepEqual(
    missing,
    [],
    'a code retires only with the outcome it named (docs/API_STABILITY.md): list it under retired.reasonCodes with the reason, or keep it'
  );
});

test('each retirement names something the release shipped and that is gone', () => {
  const shippedCodes = new Set(
    Object.entries(RELEASED.reasonCodes).flatMap(([id, codes]) => codes.map((c) => `${id}/${c}`))
  );
  const stale = [
    ...Object.keys(retired.ruleIds).filter(
      (id) => !RELEASED.ruleIds.includes(id) || RULE_IDS.has(id)
    ),
    ...Object.keys(retired.reasonCodes).filter((key) => !shippedCodes.has(key) || CODES.has(key))
  ];
  assert.deepEqual(stale, []);
});
