'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// This test asserts the "contract" invariants on the *generated* catalog.
// It doesn't try to unit-test build-core.js directly; it protects against
// accidental rule metadata drift.

test('CHECK_DEFS contract invariants', () => {
  // eslint-disable-next-line global-require
  const core = require('../src/core');

  assert.equal(typeof core.ENGINE_TAG, 'string');
  assert.ok(core.ENGINE_TAG.length > 0);

  assert.equal(typeof core.SCHEMA_VERSION, 'string');
  assert.ok(core.SCHEMA_VERSION.length > 0);

  assert.ok(Array.isArray(core.CHECK_DEFS));
  assert.ok(core.CHECK_DEFS.length > 0);

  for (const def of core.CHECK_DEFS) {
    assert.equal(typeof def.ruleId, 'string');
    assert.ok(def.ruleId.length > 0);
    assert.ok(!def.ruleId.startsWith(core.ENGINE_TAG + '-'), 'ruleId should be bare, not engine-prefixed');
    assert.ok(Array.isArray(def.tags) && def.tags.includes(core.ENGINE_TAG), 'every rule should carry the engine tag in meta.tags');

    assert.equal(typeof def.title, 'string');
    assert.ok(def.title.trim().length > 0);

    assert.equal(typeof def.description, 'string');
    assert.equal(typeof def.helpUrl, 'string');

    assert.ok(Array.isArray(def.tags));
    assert.ok(def.tags.includes(core.ENGINE_TAG), `${def.ruleId} must include ENGINE_TAG in tags`);
    // Build-time normalization guarantees lowercase
    for (const t of def.tags) assert.equal(String(t), String(t).toLowerCase());

    assert.ok(Array.isArray(def.normativeMappings), `${def.ruleId} normativeMappings must be an array`);
    for (const m of def.normativeMappings) {
      assert.ok(m && typeof m === 'object' && !Array.isArray(m), `${def.ruleId} normativeMappings entries must be plain objects`);
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

    // Deprecation contract (docs/API_STABILITY.md) -- every rule carries
    // these, whether or not it's actually deprecated.
    assert.equal(typeof def.deprecated, 'boolean');
    if (def.deprecated) {
      assert.ok(def.deprecation && typeof def.deprecation === 'object', `${def.ruleId}: deprecated rules must carry meta.deprecation`);
      assert.equal(typeof def.deprecation.reason, 'string');
      assert.ok(def.deprecation.reason.length > 0, `${def.ruleId}: deprecation.reason must be non-empty`);
      assert.equal(typeof def.deprecation.sinceVersion, 'string');
      assert.ok(def.deprecation.sinceVersion.length > 0, `${def.ruleId}: deprecation.sinceVersion must be non-empty`);
      assert.ok(def.deprecation.replacedBy === null || typeof def.deprecation.replacedBy === 'string');
    } else {
      assert.equal(def.deprecation, null, `${def.ruleId}: non-deprecated rules must have deprecation:null`);
    }

    assert.ok(def.category === null || typeof def.category === 'string');
    assert.ok(def.standard === null || typeof def.standard === 'string');

    assert.equal(typeof def.applicability, 'string');
    assert.equal(typeof def.expectation, 'string');

    assert.ok(Array.isArray(def.references));

    assert.ok(def.requirements === null || typeof def.requirements === 'string' || typeof def.requirements === 'object');
    assert.ok(def.mappings === null || typeof def.mappings === 'string' || typeof def.mappings === 'object');
  }
});

test('getChecksCatalog includes contract fields', () => {
  // eslint-disable-next-line global-require
  const core = require('../src/core');

  const catalog = core.getChecksCatalog();
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length === core.CHECK_DEFS.length);

  const first = catalog[0];
  assert.ok(first);
  assert.equal(typeof first.ruleId, 'string');

  assert.ok(Array.isArray(first.normativeMappings));

  // Spot-check a few fields are present in catalog entries
  assert.equal(typeof first.ruleInterfaceVersion, 'string');
  assert.equal(typeof first.ruleVersion, 'string');
  assert.equal(typeof first.normative, 'boolean');
  assert.equal(typeof first.atomic, 'boolean');
  assert.equal(typeof first.deprecated, 'boolean');
  assert.equal(first.deprecation, null, 'no shipped rule is deprecated yet');
});
