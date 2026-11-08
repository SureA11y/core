'use strict';

/**
 * Data can carry keys named __proto__, constructor and prototype (JSON keeps
 * "__proto__" as a key). Nothing that writes by a key taken from a pack's
 * data may reach Object.prototype through one: standard data refuses them,
 * deriveStandard refuses them in its bases and its own data, and the code
 * that reads a standard's texts and review skips them, so a pack written by
 * hand can't pollute either.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkStandardData, standardFromData } = require('../src/standard-data.js');
const { deriveStandard } = require('../src/derive-standard.js');
const { checkPack, ruleMappedStandard, packTranslationCoverage } = require('../src/pack.js');
const { howToCheckFor } = require('../src/index.js');

const clean = () =>
  ['polluted', 'x', 'title', 'steps'].every(
    (k) => !Object.prototype.hasOwnProperty.call(Object.prototype, k)
  );

const parse = (json) => JSON.parse(json);
const base = () =>
  parse(
    '{"format":"surea11y-standard/1","key":"aa","standard":"AA","versions":[{"version":"1","wcagVersion":"2.2"}],' +
      '"data":{"1":{"requirements":{"A":{"title":"A"}},"ruleMap":{},' +
      '"review":{"__proto__":{"polluted":{"steps":["x"],"passWhen":"p","failWhen":"f"}}}}}}'
  );

test('standard data refuses a key that would reach Object.prototype, anywhere in it', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const data = base();
    data.data[1].review = parse(
      `{"${key}":{"polluted":{"steps":["x"],"passWhen":"p","failWhen":"f"}}}`
    );
    assert.match(
      checkStandardData(data).join('\n'),
      new RegExp(`a key named "${key}" is not allowed`)
    );
    assert.throws(() => standardFromData(data), /is not allowed/);
  }
  assert.ok(clean());
});

test('deriveStandard refuses it in a base and in its own data, before using either', () => {
  const own = {
    format: 'surea11y-standard/1',
    key: 'der',
    standard: 'D',
    versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'aa', version: '1' }] }],
    data: { 1: { requirements: { A: { basedOn: [{ standard: 'aa', id: 'A' }] } }, ruleMap: {} } }
  };
  assert.throws(() => deriveStandard([base()], own), /bases\[0\].*"__proto__" is not allowed/);
  const safeBase = base();
  safeBase.data[1].review = {};
  const bad = JSON.parse(JSON.stringify(own));
  bad.data[1].texts = parse('{"__proto__":{"x":"y"}}');
  assert.throws(
    () => deriveStandard([safeBase], bad),
    /own\.data\.1\.texts: a key named "__proto__"/
  );
  assert.ok(clean());
});

test("a pack written by hand can't pollute through its texts or its review either", () => {
  const std = ruleMappedStandard({
    standard: 'City',
    tag: 'city',
    versions: [{ version: '1', wcagVersion: '2.2' }],
    requirements: { 1: { A: { title: 'Attr', wcagSc: ['4.1.2'] } } },
    ruleMap: { 1: { 'aria-valid-attr-value': { requirements: ['A'] } } }
  });
  const pack = {
    name: 'city',
    version: '1.0.0',
    namespace: 'city',
    core: '*',
    standard: {
      key: 'city',
      standard: 'City',
      versions: ['1'],
      lang: 'en',
      profiles: { 'city-1': { version: '1', tags: ['city'], mappedRules: true } },
      ruleTag: 'city',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      texts: parse('{"fr":{"__proto__":{"title":"x"},"1":{"__proto__":"x"}}}'),
      reviewByVersion: parse(
        '{"1":{"__proto__":{"ARIA_HASPOPUP_ROLE_MISMATCH":{"steps":["x"],"passWhen":"p","failWhen":"f"}}}}'
      )
    }
  };
  const problems = checkPack(pack).join('\n');
  assert.match(problems, /a key named "__proto__" is not allowed/);
  packTranslationCoverage(pack);
  howToCheckFor('aria-valid-attr-value', 'ARIA_HASPOPUP_ROLE_MISMATCH', 'fr', {
    packs: [pack],
    profile: 'city-1'
  });
  assert.ok(clean());
});
