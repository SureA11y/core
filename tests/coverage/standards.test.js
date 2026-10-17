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
  createRegistry,
  withStandardMappings,
  standardsData
} = require('../../src/coverage/standards');
const restating = require('../fixtures/packs/restating.js');
const { standardsOf, standardOfEntryIn } = require('../../src/scan-result');
const core = require('../../src/core.js');
const { FACETS } = require('../../src/coverage/wcag-facets');

// --- the contract every registered standard keeps ---------------------------

// Core's own standards, and one a pack brings: core registers none of its
// own, and a pack's standard keeps the same contract.
const STANDARDS = NORMATIVE_STANDARDS.concat([restating.standard]);

test('every standard has a unique lowercase key and a unique display name', () => {
  const keys = STANDARDS.map((s) => s.key);
  const names = STANDARDS.map((s) => s.standard);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(names).size, names.length);
  for (const s of STANDARDS) {
    assert.match(s.key, /^[a-z0-9-]+$/, s.key);
    assert.notEqual(s.standard, 'WCAG');
    assert.ok(s.versions.length > 0, s.key);
    assert.equal(typeof s.mappingsFor, 'function', s.key);
  }
});

// An entry's wcagSc may be empty: a standard can make requirements WCAG does
// not (a company's, a country's). What it lists must be real criteria.
test('every entry a standard gives names its standard, a known version and real WCAG criteria', () => {
  const wcagSc = Object.keys(FACETS);
  for (const s of STANDARDS) {
    for (const check of core.getChecksCatalog()) {
      for (const m of s.mappingsFor({ id: check.ruleId, wcagSc: check.wcagSc })) {
        const where = `${s.key} ${check.ruleId}`;
        assert.equal(m.standard, s.standard, where);
        assert.ok(s.versions.includes(m.version), where);
        assert.ok(m.requirement && m.title, where);
        assert.ok(Array.isArray(m.wcagSc), where);
        for (const sc of m.wcagSc) assert.ok(wcagSc.includes(sc), `${where} ${sc}`);
      }
    }
  }
});

test('profiles are uniquely named and target a version their standard has', () => {
  const names = ['wcag22-aa', 'section508'];
  for (const s of STANDARDS) {
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

test('standardOfEntryIn: finds the listed standard, not WCAG or unknown ones', () => {
  const standards = standardsOf({ checksResults: [], standards: [{ key: 'en301549', standard: 'EN 301 549' }] });
  const of = (m) => standardOfEntryIn(standards, m);
  assert.equal(of({ standard: 'EN 301 549', requirement: '9.1.1.1' }), standards[0]);
  assert.equal(of({ standard: 'WCAG', requirement: '1.1.1' }), null);
  assert.equal(of({ standard: 'ARIA', requirement: '1.1' }), null);
  assert.equal(of({ standard: 'EN 301 549' }), null);
  assert.equal(of(null), null);
});

test('standardsOf: a result without the list is read against the built-in registry', () => {
  assert.deepEqual(
    standardsOf({ checksResults: [] }).map((s) => s.key),
    NORMATIVE_STANDARDS.map((s) => s.key)
  );
});

// --- attaching entries to normativeMappings ----------------------------------

// Core registers no standard of its own, so the helpers are checked over a
// registry holding one that restates WCAG criterion by criterion.
const RESTATING = createRegistry([restating.standard]);
const restatedOf = (mappings) => mappings.filter((m) => m.standard === 'Restating Standard');

test('withStandardMappings: appends every standard\'s entries after the rule\'s own', () => {
  const own = [{ standard: 'WCAG', requirement: '1.4.3', conformanceLevel: 'AA' }];
  assert.deepEqual(
    RESTATING.withStandardMappings(own, 'color-contrast'),
    own.concat(RESTATING.standardMappingsFor({ id: 'color-contrast', wcagSc: ['1.4.3'] }))
  );
  assert.deepEqual(
    restatedOf(RESTATING.withStandardMappings(own, 'color-contrast')).map((m) => m.version),
    ['1.0', '2.0']
  );
});

test('withStandardMappings: follows WCAG criteria only, not Understanding or other standards', () => {
  const own = [
    { standard: 'WCAG', type: 'Understanding', requirement: '2.1.1' },
    { standard: 'ARIA', requirement: '1.4.3' }
  ];
  assert.deepEqual(withStandardMappings(own, 'x'), own);
  assert.deepEqual(RESTATING.withStandardMappings(own, 'x'), own);
});

test('withStandardMappings: an entry the rule already declares is not repeated', () => {
  const declared = {
    standard: 'Restating Standard',
    version: '1.0',
    requirement: 'R2.1.1',
    title: 'Keyboard'
  };
  const out = RESTATING.withStandardMappings(
    [{ standard: 'WCAG', requirement: '2.1.1' }, declared],
    'x'
  );
  assert.deepEqual(
    restatedOf(out).map((m) => m.version),
    ['1.0', '2.0']
  );
  assert.equal(restatedOf(out)[0], declared);
});

test('withStandardMappings: a missing or non-array list yields an empty list', () => {
  for (const v of [null, undefined, 'x', {}]) assert.deepEqual(withStandardMappings(v, 'x'), []);
});

test('a rule tag is lowercase, not a WCAG tag, and selected by its standard\'s profiles', () => {
  for (const s of STANDARDS) {
    if (!s.ruleTag) continue;
    assert.match(s.ruleTag, /^[a-z0-9-]+$/, s.key);
    assert.doesNotMatch(s.ruleTag, /^wcag/, s.key);
    // Otherwise the standard's own rules could never run through its profile.
    for (const [name, p] of Object.entries(s.profiles || {})) {
      assert.ok(p.tags.includes(s.ruleTag), name);
    }
  }
});
