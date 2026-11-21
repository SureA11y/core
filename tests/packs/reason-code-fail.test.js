'use strict';

// A rule-mapped standard can be certain where WCAG asks: `outcome: 'fail'`
// on a reason code makes a cantTell finding of that code a failure of the
// standard's requirement. An unnamed role="grid" is cantTell for WCAG 4.1.2,
// which depends on what the page shows, and fails WAI-ARIA's "Accessible
// Name Required" for certain. Scanned under the pack's profile, the check
// takes the pack's verdict, as it does in a scan of several profiles; under
// a WCAG profile it and the WCAG rollups stay as they were.

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
  assert.equal(check(result).outcome, 'fail');
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
  assert.equal(check(read).outcome, 'fail');
  assert.equal(rollup(read).outcome, 'fail');
});

// Round 8, NW-4: a standard's verdict comes after the policy step, and made a
// check fail that the scan's policy doesn't allow to fail.
test("a standard's certain failure keeps to the scan's policy", () => {
  const policy = { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] };
  for (const profile of ['names-1.0', ['names-1.0', 'wcag22-aa']]) {
    const result = scan(UNNAMED_GRID, { packs: [pack], profile, policy });
    const c = check(result);
    assert.equal(c.outcome, 'cantTell', JSON.stringify(profile));
    assert.equal(c.policyOutcome, 'fail', JSON.stringify(profile));
    assert.ok(
      c.occurrences.every((o) => o.occurrenceOutcome !== 'fail'),
      JSON.stringify(profile)
    );
  }
});

// Round 8, PK-1: in a scan of several profiles, a profile that counts none of
// a check's findings gave it pass, where a scan of that profile alone keeps
// the rule's own outcome.
test('a profile that counts none of the findings keeps the outcome its scan alone gives', () => {
  const ignoring = ruleMappedStandard({
    standard: 'Quiet Standard',
    tag: 'quiet',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { Q1: { title: 'Images', wcagSc: ['1.1.1'] } } },
    ruleMap: {
      '1.0': {
        'img-alt-present': {
          requirements: ['Q1'],
          reasonCodes: { TEXT_ALTERNATIVE_MISSING: { requirements: [] } }
        }
      }
    }
  });
  const quiet = definePack({
    name: 'quiet-pack',
    version: '1.0.0',
    namespace: 'quiet',
    core: '*',
    standard: {
      key: 'quiet',
      standard: 'Quiet Standard',
      versions: ['1.0'],
      profiles: { 'quiet-1.0': { version: '1.0', tags: ['quiet'], mappedRules: true } },
      ruleTag: 'quiet',
      ruleMapped: true,
      mappingsFor: ignoring.mappingsFor,
      composites: ignoring.composites,
      validate: ignoring.validate
    }
  });
  const page = '<img src="a.png">';
  const img = (result) => result.checksResults.find((c) => c.ruleId === 'img-alt-present');
  const alone = img(scan(page, { packs: [quiet], profile: 'quiet-1.0' }));
  const both = img(scan(page, { packs: [quiet, pack], profile: ['quiet-1.0', 'names-1.0'] }));
  assert.equal(alone.outcome, 'fail');
  assert.equal(both.outcome, alone.outcome);
});
