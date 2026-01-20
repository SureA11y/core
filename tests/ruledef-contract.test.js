'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// This test asserts the "contract" invariants on the *generated* catalog.
// It doesn't try to unit-test build-core.js directly; it protects against
// accidental rule metadata drift.

test('RULE_DEFS contract invariants', () => {
  // eslint-disable-next-line global-require
  const core = require('../src/core');

  assert.equal(typeof core.ENGINE_TAG, 'string');
  assert.ok(core.ENGINE_TAG.length > 0);

  assert.equal(typeof core.SCHEMA_VERSION, 'string');
  assert.ok(core.SCHEMA_VERSION.length > 0);

  assert.ok(Array.isArray(core.RULE_DEFS));
  assert.ok(core.RULE_DEFS.length > 0);

  for (const def of core.RULE_DEFS) {
    assert.equal(typeof def.ruleId, 'string');
    assert.ok(def.ruleId.startsWith(core.ENGINE_TAG + '-'));

    assert.equal(typeof def.title, 'string');
    assert.ok(def.title.trim().length > 0);

    assert.equal(typeof def.description, 'string');
    assert.equal(typeof def.helpUrl, 'string');

    if (def.type === 'manual') {
      assert.equal(def.normativeMappings.length, 0, `${def.ruleId} is manual, so normativeMappings must be empty`);
    }

    assert.ok(Array.isArray(def.tags));
    assert.ok(def.tags.includes(core.ENGINE_TAG), `${def.ruleId} must include ENGINE_TAG in tags`);
    // Build-time normalization guarantees lowercase
    for (const t of def.tags) assert.equal(String(t), String(t).toLowerCase());

    assert.ok(Array.isArray(def.normativeMappings), `${def.ruleId} normativeMappings must be an array`);
    for (const m of def.normativeMappings) {
      assert.ok(m && typeof m === 'object' && !Array.isArray(m), `${def.ruleId} normativeMappings entries must be plain objects`);
    }

    assert.ok(Array.isArray(def.informativeReferences), `${def.ruleId} informativeReferences must be an array`);
    for (const r of def.informativeReferences) {
      assert.ok(r && typeof r === 'object' && !Array.isArray(r), `${def.ruleId} informativeReferences entries must be plain objects`);
    }

    assert.ok(['automatic', 'manual'].includes(def.type));

    // Scoring defaults
    assert.equal(typeof def.defaultSeverity, 'string');
    assert.ok(def.defaultSeverity.length > 0);
    assert.equal(typeof def.defaultConfidence, 'string');
    assert.ok(def.defaultConfidence.length > 0);

    // Contract fields
    assert.equal(typeof def.ruleInterfaceVersion, 'string');
    assert.ok(def.ruleInterfaceVersion.length > 0);

    assert.equal(typeof def.ruleVersion, 'string');
    assert.ok(def.ruleVersion.length > 0);

    assert.equal(typeof def.normative, 'boolean');
    assert.equal(typeof def.atomic, 'boolean');

    assert.ok(def.category === null || typeof def.category === 'string');
    assert.ok(def.standard === null || typeof def.standard === 'string');

    assert.equal(typeof def.applicability, 'string');
    assert.equal(typeof def.expectation, 'string');

    assert.ok(Array.isArray(def.references));

    assert.ok(def.requirements === null || typeof def.requirements === 'string' || typeof def.requirements === 'object');
    assert.ok(def.mappings === null || typeof def.mappings === 'string' || typeof def.mappings === 'object');
  }
});

test('getRulesCatalog includes contract fields', () => {
  // eslint-disable-next-line global-require
  const core = require('../src/core');

  const catalog = core.getRulesCatalog();
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length === core.RULE_DEFS.length);

  const first = catalog[0];
  assert.ok(first);
  assert.equal(typeof first.ruleId, 'string');

  assert.ok(Array.isArray(first.normativeMappings));
  assert.ok(Array.isArray(first.informativeReferences));

  // Spot-check a few fields are present in catalog entries
  assert.equal(typeof first.ruleInterfaceVersion, 'string');
  assert.equal(typeof first.ruleVersion, 'string');
  assert.equal(typeof first.normative, 'boolean');
  assert.equal(typeof first.atomic, 'boolean');
});
