'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { normalizeRuleMeta } = require('../../src/core/rule-meta.js');

// Deprecation-mechanism tests already live in tests/core/api-stability.test.js
// (docs/API_STABILITY.md's live regression guard); this file covers the rest
// of normalizeRuleMeta's field normalization directly.

test('normalizeRuleMeta: title falls back to the rule id when meta.title is missing or blank', () => {
  assert.equal(normalizeRuleMeta('r', 'my-rule', {}, 'a11ycore').title, 'my-rule');
  assert.equal(normalizeRuleMeta('r', 'my-rule', { title: '   ' }, 'a11ycore').title, 'my-rule');
  assert.equal(
    normalizeRuleMeta('r', 'my-rule', { title: ' Real Title ' }, 'a11ycore').title,
    'Real Title'
  );
});

test('normalizeRuleMeta: description/helpUrl default to empty string when absent or non-string', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.description, '');
  assert.equal(a.helpUrl, '');

  const b = normalizeRuleMeta('r', 'r', { description: 123, helpUrl: null }, 'a11ycore');
  assert.equal(b.description, '');
  assert.equal(b.helpUrl, '');
});

test('normalizeRuleMeta: tags are lowercased and deduplicated against a missing engineTag, which is auto-appended', () => {
  const a = normalizeRuleMeta('r', 'r', { tags: ['WCAG2A', ' Keyboard '] }, 'a11ycore');
  assert.deepEqual(a.tags, ['wcag2a', 'keyboard', 'a11ycore']);
});

test('normalizeRuleMeta: engineTag is not duplicated when the rule already declares it', () => {
  const a = normalizeRuleMeta('r', 'r', { tags: ['a11ycore', 'keyboard'] }, 'a11ycore');
  assert.deepEqual(a.tags, ['a11ycore', 'keyboard']);
});

test('normalizeRuleMeta: a non-array meta.tags normalizes to just the engineTag', () => {
  const a = normalizeRuleMeta('r', 'r', { tags: 'not-an-array' }, 'a11ycore');
  assert.deepEqual(a.tags, ['a11ycore']);
});

test('normalizeRuleMeta: normativeMappings filters out non-object and array entries, keeping only plain objects', () => {
  const a = normalizeRuleMeta(
    'r',
    'r',
    {
      normativeMappings: [
        { standard: 'WCAG', requirement: '1.1.1' },
        'not-an-object',
        42,
        ['also-not-an-object'],
        null
      ]
    },
    'a11ycore'
  );
  assert.deepEqual(a.normativeMappings, [{ standard: 'WCAG', requirement: '1.1.1' }]);
});

test('normalizeRuleMeta: a non-array meta.normativeMappings/informativeReferences normalizes to []', () => {
  const a = normalizeRuleMeta(
    'r',
    'r',
    { normativeMappings: 'x', informativeReferences: 42 },
    'a11ycore'
  );
  assert.deepEqual(a.normativeMappings, []);
  assert.deepEqual(a.informativeReferences, []);
});

test('normalizeRuleMeta: wcagSc is derived only from WCAG-standard normativeMappings, deduplicated and sorted', () => {
  const a = normalizeRuleMeta(
    'r',
    'r',
    {
      normativeMappings: [
        { standard: 'wcag', requirement: '2.4.4' },
        { standard: 'WCAG', requirement: '1.1.1' },
        { standard: 'WCAG', requirement: '1.1.1' }, // duplicate
        { standard: 'Section508', requirement: '1194.22' }, // not WCAG, excluded
        { standard: 'WCAG', requirement: '  ' }, // blank requirement, excluded
        'not-an-object' // filtered out entirely before wcagSc derivation
      ]
    },
    'a11ycore'
  );
  assert.deepEqual(a.wcagSc, ['1.1.1', '2.4.4']);
});

test('normalizeRuleMeta: defaultSeverity/defaultConfidence default to "moderate"/"medium", overridable', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.defaultSeverity, 'moderate');
  assert.equal(a.defaultConfidence, 'medium');

  const b = normalizeRuleMeta(
    'r',
    'r',
    { defaultSeverity: 'critical', defaultConfidence: 'high' },
    'a11ycore'
  );
  assert.equal(b.defaultSeverity, 'critical');
  assert.equal(b.defaultConfidence, 'high');
});

test('normalizeRuleMeta: type defaults to "automatic" and accepts only "automatic"/"manual"', () => {
  assert.equal(normalizeRuleMeta('r', 'r', {}, 'a11ycore').type, 'automatic');
  assert.equal(normalizeRuleMeta('r', 'r', { type: 'manual' }, 'a11ycore').type, 'manual');
  assert.equal(normalizeRuleMeta('r', 'r', { type: 'bogus' }, 'a11ycore').type, 'automatic');
});

test('normalizeRuleMeta: coverage passes through string/object/null, coerces anything else to null', () => {
  assert.equal(normalizeRuleMeta('r', 'r', { coverage: 'full' }, 'a11ycore').coverage, 'full');
  assert.deepEqual(
    normalizeRuleMeta('r', 'r', { coverage: { level: 'partial' } }, 'a11ycore').coverage,
    { level: 'partial' }
  );
  assert.equal(normalizeRuleMeta('r', 'r', { coverage: 42 }, 'a11ycore').coverage, null);
  assert.equal(normalizeRuleMeta('r', 'r', {}, 'a11ycore').coverage, null);
});

test('normalizeRuleMeta: ruleInterfaceVersion/ruleVersion default and trim', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.ruleInterfaceVersion, '1.0.0');
  assert.equal(a.ruleVersion, '0.0.0');

  const b = normalizeRuleMeta(
    'r',
    'r',
    { ruleInterfaceVersion: ' 2.0.0 ', ruleVersion: ' 1.3.1 ' },
    'a11ycore'
  );
  assert.equal(b.ruleInterfaceVersion, '2.0.0');
  assert.equal(b.ruleVersion, '1.3.1');
});

test('normalizeRuleMeta: normative/atomic default true, overridable to false', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.normative, true);
  assert.equal(a.atomic, true);

  const b = normalizeRuleMeta('r', 'r', { normative: false, atomic: false }, 'a11ycore');
  assert.equal(b.normative, false);
  assert.equal(b.atomic, false);
});

test('normalizeRuleMeta: category/standard default to null, trimmed strings pass through', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.category, null);
  assert.equal(a.standard, null);

  const b = normalizeRuleMeta('r', 'r', { category: ' Forms ', standard: ' WCAG2.2 ' }, 'a11ycore');
  assert.equal(b.category, 'Forms');
  assert.equal(b.standard, 'WCAG2.2');
});

test('normalizeRuleMeta: applicability/expectation default to "", references default to []', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.applicability, '');
  assert.equal(a.expectation, '');
  assert.deepEqual(a.references, []);

  const b = normalizeRuleMeta(
    'r',
    'r',
    {
      applicability: 'Applies to all images.',
      expectation: 'Every image has alt text.',
      references: ['https://example.test/ref']
    },
    'a11ycore'
  );
  assert.equal(b.applicability, 'Applies to all images.');
  assert.equal(b.expectation, 'Every image has alt text.');
  assert.deepEqual(b.references, ['https://example.test/ref']);
});

test('normalizeRuleMeta: requirements/mappings pass through string/object/null, coerce anything else to null', () => {
  assert.equal(
    normalizeRuleMeta('r', 'r', { requirements: 'req-text' }, 'a11ycore').requirements,
    'req-text'
  );
  assert.deepEqual(
    normalizeRuleMeta('r', 'r', { mappings: { external: 'image-alt' } }, 'a11ycore').mappings,
    { external: 'image-alt' }
  );
  assert.equal(normalizeRuleMeta('r', 'r', { requirements: 42 }, 'a11ycore').requirements, null);
  assert.equal(normalizeRuleMeta('r', 'r', { mappings: true }, 'a11ycore').mappings, null);
});

// ===== i18n =====

test('normalizeRuleMeta: i18n is null by default, and passes through a valid object', () => {
  const a = normalizeRuleMeta('r', 'r', {}, 'a11ycore');
  assert.equal(a.i18n, null);

  const b = normalizeRuleMeta(
    'r',
    'r',
    { i18n: { titleKey: 'rules.myRule.title', descriptionKey: 'rules.myRule.description' } },
    'a11ycore'
  );
  assert.deepEqual(b.i18n, {
    titleKey: 'rules.myRule.title',
    descriptionKey: 'rules.myRule.description'
  });
});

test('normalizeRuleMeta: i18n without a non-empty titleKey throws', () => {
  assert.throws(
    () => normalizeRuleMeta('my-rule', 'my-rule', { i18n: {} }, 'a11ycore'),
    /meta\.i18n\.titleKey must be a non-empty string/
  );
  assert.throws(
    () => normalizeRuleMeta('my-rule', 'my-rule', { i18n: { titleKey: '   ' } }, 'a11ycore'),
    /meta\.i18n\.titleKey must be a non-empty string/
  );
});

test('normalizeRuleMeta: i18n.descriptionKey, when provided, must be a non-empty string', () => {
  assert.throws(
    () =>
      normalizeRuleMeta(
        'my-rule',
        'my-rule',
        { i18n: { titleKey: 'k', descriptionKey: '' } },
        'a11ycore'
      ),
    /meta\.i18n\.descriptionKey must be a non-empty string when provided/
  );
  assert.throws(
    () =>
      normalizeRuleMeta(
        'my-rule',
        'my-rule',
        { i18n: { titleKey: 'k', descriptionKey: 42 } },
        'a11ycore'
      ),
    /meta\.i18n\.descriptionKey must be a non-empty string when provided/
  );
});

test('normalizeRuleMeta: i18n.descriptionKey is actually optional (titleKey alone is valid)', () => {
  const a = normalizeRuleMeta('r', 'r', { i18n: { titleKey: 'k' } }, 'a11ycore');
  assert.deepEqual(a.i18n, { titleKey: 'k' });
});

test('normalizeRuleMeta: a non-object meta (e.g. undefined) normalizes to full defaults instead of throwing', () => {
  const a = normalizeRuleMeta('r', 'r', undefined, 'a11ycore');
  assert.equal(a.title, 'r');
  assert.equal(a.type, 'automatic');
  assert.deepEqual(a.tags, ['a11ycore']);
});

test('normalizeRuleMeta: a non-array normativeMappings derives no wcagSc instead of throwing', () => {
  for (const normativeMappings of [null, undefined, 'x', {}, 3]) {
    const normalized = normalizeRuleMeta('r', 'my-rule', { normativeMappings }, 'a11ycore');
    assert.deepStrictEqual(normalized.normativeMappings, []);
    assert.deepStrictEqual(normalized.wcagSc, []);
  }
});

test('normalizeRuleMeta: a non-string description or helpUrl normalizes to an empty string', () => {
  for (const bad of [null, undefined, 3, {}, []]) {
    const normalized = normalizeRuleMeta(
      'r',
      'my-rule',
      { description: bad, helpUrl: bad },
      'a11ycore'
    );
    assert.strictEqual(normalized.description, '');
    assert.strictEqual(normalized.helpUrl, '');
  }
});
