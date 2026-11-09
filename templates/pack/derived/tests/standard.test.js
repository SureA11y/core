'use strict';

/**
 * The standard, as standard-data.js derives it from __BASE__: where it says
 * what the base says, a rule's row is the base's; where it differs
 * (OWN_ROWS), a page shows the difference. Add a page here for each change
 * you make: the base's row, kept as it was, should get it wrong.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkStandardData, standardDataOf } = require('@surea11y/core/pack');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const base = require('__BASE__');
const pack = require('..');
const { STANDARD_DATA, OWN_ROWS } = require('../standard-data');

const PROFILE = '__NAMESPACE__-1.0';
const data = STANDARD_DATA.data['1.0'];
const BASE = standardDataOf(base.standard);
const baseTables = BASE.data[BASE.versions.at(-1).version];

const PAGE = `<!doctype html><html lang="en"><head><title>Home</title></head><body>
  <main><h1>Shop</h1><img src="logo.png"><a href="/offers">Offers</a></main>
</body></html>`;

const scan = (packs, html = PAGE) =>
  runa11yCoreOnHtml(html, { engineOptions: { packs, profile: PROFILE } });

// The requirements and tests a rule-map row reaches.
const reaches = (row) => [
  ...(row.requirements || []),
  ...(row.asks || []),
  ...Object.values(row.reasonCodes || {}).flatMap((r) => r.requirements || []),
  ...(row.findings || []).flatMap((f) => f.requirements || [])
];

test('the data is valid, each requirement and test known by what it is based on', () => {
  assert.deepEqual(checkStandardData(STANDARD_DATA), []);
  for (const [id, r] of Object.entries(data.requirements)) {
    for (const b of r.basedOn || []) {
      assert.ok(baseTables.requirements[b.id], `${id} is based on ${b.id}, which the base has`);
    }
  }
});

test('where the standard says what the base says, a rule’s row is the base’s', () => {
  const units = new Set([...Object.keys(data.requirements), ...Object.keys(data.tests || {})]);
  for (const [rule, row] of Object.entries(baseTables.ruleMap)) {
    if (Object.prototype.hasOwnProperty.call(OWN_ROWS, rule)) continue;
    // A row that reaches a requirement or test the standard leaves out is
    // narrowed by the derivation, not copied.
    if (!reaches(row).every((u) => units.has(u))) continue;
    if (!reaches(row).length) continue;
    assert.deepEqual(data.ruleMap[rule], row, rule);
  }
  for (const [rule, row] of Object.entries(OWN_ROWS)) {
    if (row === null) assert.equal(data.ruleMap[rule], undefined, `${rule} is dropped`);
    else assert.deepEqual(data.ruleMap[rule], row, rule);
  }
});

test('the profile reports the standard’s requirements, with the base pack in the scan', () => {
  const result = scan([base, pack]);
  assert.equal(result.skippedPacks, undefined);
  assert.equal(result.engine.profile, PROFILE);
  const rollups = result.rulesResults.filter((r) => r.ruleId.startsWith(`${PROFILE}-`));
  assert.ok(rollups.length > 0);
  for (const r of rollups) {
    assert.ok(data.requirements[r.ruleId.slice(PROFILE.length + 1)], r.ruleId);
  }
});

test('a scan without the base pack skips this one, and says why', () => {
  const result = scan([pack]);
  assert.ok(result.skippedPacks[0].reason.startsWith('it uses __BASE__@'));
});

// A change to the base's rule map, shown on a page. For example, where
// OWN_ROWS turns a rule's failure into a question:
//
// test('1.2: a hidden image with a name is a question, not a failure', () => {
//   const result = scan([base, pack], '<!doctype html>…');
//   const rollup = result.rulesResults.find((r) => r.ruleId === `${PROFILE}-1.2`);
//   assert.notEqual(rollup.outcome, 'fail');
// });
