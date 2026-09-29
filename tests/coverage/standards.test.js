'use strict';

/**
 * The registry of standards besides WCAG (src/coverage/standards.js). These pin
 * the contract every registered standard must keep, so a new one that breaks
 * it fails here rather than in a reporter, and the generic helpers the build
 * uses to attach its entries.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  NORMATIVE_STANDARDS,
  standardMappingsFor,
  withStandardMappings,
  standardsData,
  standardOfEntry
} = require('../../src/coverage/standards');
const core = require('../../src/core.js');

// --- the contract every registered standard keeps ---------------------------

test('every standard has a unique lowercase key and a unique display name', () => {
  const keys = NORMATIVE_STANDARDS.map((s) => s.key);
  const names = NORMATIVE_STANDARDS.map((s) => s.standard);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(names).size, names.length);
  for (const s of NORMATIVE_STANDARDS) {
    assert.match(s.key, /^[a-z0-9-]+$/, s.key);
    assert.notEqual(s.standard, 'WCAG');
    assert.ok(s.versions.length > 0, s.key);
    assert.equal(typeof s.mappingsFor, 'function', s.key);
  }
});

test('every entry a standard gives names its standard, a known version and its WCAG criteria', () => {
  const wcagSc = core.getRulesCatalog().flatMap((c) => (c.meta && c.meta.wcagSc) || []);
  for (const s of NORMATIVE_STANDARDS) {
    for (const check of core.getChecksCatalog()) {
      for (const m of s.mappingsFor({ id: check.ruleId, wcagSc: check.wcagSc })) {
        const where = `${s.key} ${check.ruleId}`;
        assert.equal(m.standard, s.standard, where);
        assert.ok(s.versions.includes(m.version), where);
        assert.ok(m.requirement && m.title, where);
        assert.ok(Array.isArray(m.wcagSc) && m.wcagSc.length, where);
        for (const sc of m.wcagSc) assert.ok(wcagSc.includes(sc), `${where} ${sc}`);
      }
    }
  }
});

test('profiles are uniquely named and target a version their standard has', () => {
  const names = ['wcag22-aa', 'section508'];
  for (const s of NORMATIVE_STANDARDS) {
    for (const [name, p] of Object.entries(s.profiles || {})) {
      names.push(name);
      assert.ok(s.versions.includes(p.version), name);
      assert.ok(p.tags.length > 0, name);
    }
  }
  assert.equal(new Set(names).size, names.length);
});

test('standardsData is the registry as plain JSON-safe data', () => {
  const data = standardsData();
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
  assert.deepEqual(
    data.map((s) => s.key),
    NORMATIVE_STANDARDS.map((s) => s.key)
  );
});

test('standardOfEntry: finds the registered standard, not WCAG or unknown ones', () => {
  const en = NORMATIVE_STANDARDS.find((s) => s.key === 'en301549');
  assert.equal(standardOfEntry({ standard: 'EN 301 549', requirement: '9.1.1.1' }), en);
  assert.equal(standardOfEntry({ standard: 'WCAG', requirement: '1.1.1' }), null);
  assert.equal(standardOfEntry({ standard: 'ARIA', requirement: '1.1' }), null);
  assert.equal(standardOfEntry({ standard: 'EN 301 549' }), null);
  assert.equal(standardOfEntry(null), null);
});

// --- attaching entries to normativeMappings ----------------------------------

const enOf = (mappings) => mappings.filter((m) => m.standard === 'EN 301 549');

test('withStandardMappings: appends every standard\'s entries after the rule\'s own', () => {
  const own = [{ standard: 'WCAG', requirement: '1.4.3', conformanceLevel: 'AA' }];
  assert.deepEqual(
    withStandardMappings(own, 'color-contrast'),
    own.concat(standardMappingsFor({ id: 'color-contrast', wcagSc: ['1.4.3'] }))
  );
  assert.deepEqual(
    enOf(withStandardMappings(own, 'color-contrast')).map((m) => m.version),
    ['V3.2.1', 'V4.1.1']
  );
});

test('withStandardMappings: follows WCAG criteria only, not Understanding or other standards', () => {
  const own = [
    { standard: 'WCAG', type: 'Understanding', requirement: '2.1.1' },
    { standard: 'ARIA', requirement: '1.4.3' }
  ];
  assert.deepEqual(withStandardMappings(own, 'x'), own);
});

test('withStandardMappings: an entry the rule already declares is not repeated', () => {
  const declared = {
    standard: 'EN 301 549',
    version: 'V3.2.1',
    requirement: '9.2.1.1',
    title: 'Keyboard'
  };
  const out = withStandardMappings([{ standard: 'WCAG', requirement: '2.1.1' }, declared], 'x');
  assert.deepEqual(
    enOf(out).map((m) => m.version),
    ['V3.2.1', 'V4.1.1']
  );
  assert.equal(enOf(out)[0], declared);
});

test('withStandardMappings: a missing or non-array list yields an empty list', () => {
  for (const v of [null, undefined, 'x', {}]) assert.deepEqual(withStandardMappings(v, 'x'), []);
});
