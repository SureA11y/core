'use strict';

// A rule-mapped standard can send a rule's findings of one reason code to
// other requirements, or make them questions there (ruleMap reasonCodes,
// src/profile-kit.js): a requirement's rollup then judges the rule by the
// findings that count toward it, not by the rule's outcome as a whole.

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkPack, definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { coercedResult } = require('../../src/scan-result.js');

const requirements = {
  '1.0': {
    L1: { title: 'List markup', wcagSc: ['1.3.1'] },
    L2: { title: 'List semantics', wcagSc: ['1.3.1'] }
  }
};
const ruleMap = {
  '1.0': {
    'list-children-valid': {
      requirements: ['L1'],
      reasonCodes: {
        LIST_ITEM_ROLE_OVERRIDDEN: { requirements: ['L1', 'L2'], outcome: 'cantTell' }
      }
    }
  }
};
const std = ruleMappedStandard({
  standard: 'Codes Standard',
  tag: 'codes',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements,
  ruleMap
});
const pack = definePack({
  name: 'codes-pack',
  version: '1.0.0',
  namespace: 'codes',
  core: '*',
  standard: {
    key: 'codes',
    standard: 'Codes Standard',
    versions: ['1.0'],
    profiles: { 'codes-1.0': { version: '1.0', tags: ['codes'], mappedRules: true } },
    ruleTag: 'codes',
    ruleMapped: true,
    mappingsFor: std.mappingsFor,
    composites: std.composites,
    validate: std.validate
  }
});

const scan = (body) =>
  runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { engineOptions: { packs: [pack], profile: 'codes-1.0' } }
  );
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === `codes-1.0-${id}`);

test('a finding whose code the map makes a question is one, in every requirement it goes to', () => {
  const result = scan('<ul><li>1</li><li role="presentation">…</li></ul>');
  assert.equal(
    result.checksResults.find((c) => c.ruleId === 'list-children-valid').outcome,
    'fail'
  );
  for (const id of ['L1', 'L2']) {
    const r = rollup(result, id);
    assert.equal(r.outcome, 'cantTell', id);
    const c = r.data.details.contributors.find((x) => x.testId === 'list-children-valid');
    assert.deepEqual([c.outcome, c.byReasonCode, c.checkOutcome], ['cantTell', true, 'fail']);
  }
});

test('a finding of another code fails the row requirement, and leaves the others', () => {
  const result = scan('<ul><li>1</li><div>stray</div></ul>');
  assert.equal(rollup(result, 'L1').outcome, 'fail');
  assert.equal(rollup(result, 'L2').outcome, 'pass');
});

test('a rule with no findings counts as it is', () => {
  const result = scan('<ul><li>1</li></ul>');
  assert.equal(rollup(result, 'L1').outcome, 'pass');
  assert.equal(rollup(result, 'L2').outcome, 'pass');
});

test('the rule maps to every requirement its codes send findings to', () => {
  assert.deepEqual(
    std.mappingsFor({ id: 'list-children-valid' }).map((m) => m.requirement),
    ['L1', 'L2']
  );
});

// Read back with the check lowered to cantTell (its policy no longer allows
// fail): the requirement its finding counted toward drops to cantTell, and
// one the finding never went to stays a pass.
test('a stored result read back keeps the judgement by reason code', () => {
  const stored = JSON.parse(JSON.stringify(scan('<ul><li>1</li><div>stray</div></ul>')));
  stored.checksResults.find((c) => c.ruleId === 'list-children-valid').policyOutcome = 'fail';
  const read = coercedResult(stored);
  assert.equal(
    read.checksResults.find((c) => c.ruleId === 'list-children-valid').outcome,
    'cantTell'
  );
  assert.equal(rollup(read, 'L1').outcome, 'cantTell');
  assert.equal(rollup(read, 'L2').outcome, 'pass');
});

test('the map is checked', () => {
  const bad = ruleMappedStandard({
    standard: 'Codes Standard',
    tag: 'codes',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements,
    ruleMap: {
      '1.0': {
        'list-children-valid': {
          requirements: ['L1'],
          reasonCodes: { X: { requirements: ['L9'] }, Y: { outcome: 'fail' }, Z: 'cantTell' }
        }
      }
    }
  });
  assert.deepEqual(bad.validate([{ ruleId: 'list-children-valid', wcagSc: ['1.3.1'] }]), [
    '1.0 list-children-valid X: no requirement L9',
    "1.0 list-children-valid Y: outcome can only be 'cantTell'",
    '1.0 list-children-valid Z: must be { requirements, outcome }'
  ]);
});

test("checkPack and definePack run a standard's own checks, as a scan does", () => {
  // A version with no WCAG version, and a finding sent to a requirement the
  // table lacks: a scan skips such a pack, so it is refused up front.
  const broken = (versions, map) => {
    const s = ruleMappedStandard({
      standard: 'Broken Standard',
      tag: 'broken',
      versions,
      requirements,
      ruleMap: map
    });
    return {
      name: 'broken-pack',
      version: '1.0.0',
      namespace: 'broken',
      core: '*',
      standard: {
        key: 'broken',
        standard: 'Broken Standard',
        versions: ['1.0'],
        profiles: { 'broken-1.0': { version: '1.0', tags: ['broken'], mappedRules: true } },
        ruleTag: 'broken',
        ruleMapped: true,
        mappingsFor: s.mappingsFor,
        composites: s.composites,
        validate: s.validate
      }
    };
  };
  const noWcag = broken([{ version: '1.0' }], ruleMap);
  assert.match(checkPack(noWcag).join(' | '), /standard: version 1\.0: wcagVersion must be one of/);
  assert.throws(() => definePack(noWcag), /wcagVersion must be one of/);
  const unknown = broken([{ version: '1.0', wcagVersion: '2.2' }], {
    '1.0': {
      'list-children-valid': {
        requirements: ['L1'],
        findings: [{ when: { element: 'ul' }, requirements: ['L9'] }]
      }
    }
  });
  assert.match(checkPack(unknown).join(' | '), /standard: .*requirement L9/);
});
