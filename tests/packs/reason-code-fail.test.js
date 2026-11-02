'use strict';

// A rule-mapped standard can be certain where WCAG asks: `outcome: 'fail'`
// on a reason code makes a cantTell finding of that code a failure of the
// standard's requirement. An unnamed role="grid" is cantTell for WCAG 4.1.2,
// which depends on what the page shows, and fails WAI-ARIA's "Accessible
// Name Required" for certain. The check's own outcome and the WCAG rollups
// stay as they were.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { coercedResult } = require('../../src/scan-result.js');

const requirements = {
  '1.0': { N1: { title: 'Roles that require a name have one', wcagSc: ['4.1.2'] } }
};
const ruleMap = {
  '1.0': {
    'aria-role-name-present': {
      requirements: ['N1'],
      reasonCodes: { name_missing: { outcome: 'fail' } }
    }
  }
};
const std = ruleMappedStandard({
  standard: 'Names Standard',
  tag: 'names',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements,
  ruleMap
});
const pack = definePack({
  name: 'names-pack',
  version: '1.0.0',
  namespace: 'names',
  core: '*',
  standard: {
    key: 'names',
    standard: 'Names Standard',
    versions: ['1.0'],
    profiles: { 'names-1.0': { version: '1.0', tags: ['names'], mappedRules: true } },
    ruleTag: 'names',
    ruleMapped: true,
    mappingsFor: std.mappingsFor,
    composites: std.composites,
    validate: std.validate
  }
});

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
const scan = (body, engineOptions = { packs: [pack], profile: 'names-1.0' }) =>
  runa11yCoreOnHtml(page(body), { engineOptions });
const check = (result) => result.checksResults.find((c) => c.ruleId === 'aria-role-name-present');
const rollup = (result) => result.rulesResults.find((r) => r.ruleId === 'names-1.0-N1');

const UNNAMED_GRID = '<div role="grid"><div role="row"><div role="gridcell">1</div></div></div>';

test('a cantTell finding of a code the map makes a failure fails the requirement', () => {
  const result = scan(UNNAMED_GRID);
  assert.equal(check(result).outcome, 'cantTell');
  const r = rollup(result);
  assert.equal(r.outcome, 'fail');
  const c = r.data.details.contributors.find((x) => x.testId === 'aria-role-name-present');
  assert.deepEqual([c.outcome, c.byReasonCode, c.checkOutcome], ['fail', true, 'cantTell']);
});

test('the check result and the WCAG rollup keep their own outcome', () => {
  const result = scan(UNNAMED_GRID, { profile: 'wcag22-aa' });
  assert.equal(check(result).outcome, 'cantTell');
  const wcag = result.rulesResults.find((r) => r.ruleId === 'wcag-4.1.2-name');
  assert.equal(wcag.outcome, 'cantTell');
});

test('a named grid passes', () => {
  const result = scan(
    '<div role="grid" aria-label="Scores"><div role="row"><div role="gridcell">1</div></div></div>'
  );
  assert.equal(rollup(result).outcome, 'pass');
});

test('a stored result read back keeps the failure', () => {
  const read = coercedResult(JSON.parse(JSON.stringify(scan(UNNAMED_GRID))));
  assert.equal(check(read).outcome, 'cantTell');
  assert.equal(rollup(read).outcome, 'fail');
});
