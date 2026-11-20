'use strict';

// checkPack reports a rule map's reasonCodes entry naming a code its rule
// never gives (R5:AP-7): the entry can never match, so the findings it means
// to send elsewhere stay where they were. Only reported: definePack and a
// scan still take the pack, as a row that never matches harmed nothing.

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkPack, definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

function pack(code, rules) {
  const ruleId = rules ? rules[0].id : 'aria-role-name-present';
  const std = ruleMappedStandard({
    standard: 'Names',
    tag: 'nm',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { N1: { title: 'Named', wcagSc: ['4.1.2'] } } },
    ruleMap: {
      '1.0': { [ruleId]: { requirements: ['N1'], reasonCodes: { [code]: { outcome: 'fail' } } } }
    }
  });
  return {
    name: 'nm-pack',
    version: '1.0.0',
    namespace: 'nm',
    core: '*',
    ...(rules ? { rules } : {}),
    standard: {
      key: 'nm',
      standard: 'Names',
      versions: ['1.0'],
      profiles: { 'nm-1.0': { version: '1.0', tags: ['nm'], mappedRules: true } },
      ruleTag: 'nm',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  };
}

test('checkPack reports a reasonCodes entry for a code a core rule never gives (R5:AP-7)', () => {
  assert.deepEqual(checkPack(pack('name_missing')), []);
  const problems = checkPack(pack('NAME_MISSNG'));
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /aria-role-name-present gives no reason code NAME_MISSNG \(it gives name_missing, name_internals\)/
  );
});

test('a pack rule is checked against its meta.reasonCodes, and not when it declares none', () => {
  const rule = (reasonCodes) => [
    {
      id: 'nm-rule',
      meta: { title: 'T', description: 'd', tags: ['nm'], ...(reasonCodes ? { reasonCodes } : {}) },
      runInPage: () => ({ outcome: 'pass', occurrences: [] })
    }
  ];
  assert.deepEqual(checkPack(pack('OWN_CODE', rule(['OWN_CODE']))), []);
  assert.equal(checkPack(pack('OTHER', rule(['OWN_CODE']))).length, 1);
  assert.deepEqual(checkPack(pack('ANY', rule(null))), []);
});

test('such a pack is still defined and scanned', () => {
  const defined = definePack(pack('NAME_MISSNG'));
  const warn = console.warn;
  console.warn = () => {};
  try {
    const result = runa11yCoreOnHtml(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1></main></body></html>',
      { engineOptions: { packs: [defined], profile: 'nm-1.0' } }
    );
    assert.equal((result.skippedPacks || []).length, 0);
    assert.ok(result.rulesResults.some((r) => r.ruleId === 'nm-1.0-N1'));
  } finally {
    console.warn = warn;
  }
});
