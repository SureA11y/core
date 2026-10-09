'use strict';

/**
 * The catalog steps of the build (src/core/prepare-catalog.js) run on sources
 * given in memory, with a registry that was never built in: preparing core's
 * rules and the sample profile's at run time gives the catalog the engine
 * copy with the sample profile was built with (tests/helpers/sampleEngine.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { requireSample, sampleRoot } = require('../helpers/sampleEngine');
const { NORMATIVE_STANDARDS, createRegistry } = require('../../src/coverage/standards');
const {
  prepareStandards,
  prepareRules,
  prepareComposites,
  prepareProfiles,
  toCheckDefs,
  catalogHelpUrl,
  mergeDictionaries
} = require('../../src/core/prepare-catalog');
const { ruleModuleEntries } = require('../../scripts/build-core');
const { version } = require('../../package.json');
const { CORE_RULES_DIR } = require('../../scripts/lib/rule-dirs');
const WCAG_COMPOSITES = require('../../src/catalogs/composites.wcag.js');

const sampleCore = requireSample('src/core.js');
const sample = requireSample('profiles/sample/index.js');

// Core's registry with the sample's standard added at run time.
const registry = createRegistry(NORMATIVE_STANDARDS.concat([sample.standard]));
const prepare = () =>
  prepareRules(
    ruleModuleEntries([CORE_RULES_DIR, path.join(sampleRoot(), 'profiles', 'sample', 'rules')]),
    { registry, engineTag: 'a11ycore' }
  );

test('rules prepared at run time with a standard added are the ones built with it', () => {
  const defs = toCheckDefs(prepare(), {
    helpUrl: (id, meta) => catalogHelpUrl(id, meta, version)
  });
  assert.deepEqual(defs, sampleCore.CHECK_DEFS);
  const variant = defs.find((d) => d.ruleId === 'sample-contrast-enhanced');
  assert.equal(variant.variant.of, 'contrast-minimum');
  assert.ok(variant.settings.length > 0);
});

test('rollups prepared at run time include those of the added standard', () => {
  const composites = prepareComposites(WCAG_COMPOSITES, { registry });
  assert.deepEqual(composites, sampleCore.COMPOSITE_RULES);
  assert.ok(composites.some((c) => c.meta && c.meta.standard === sample.standard.standard));
});

test('the added standard brings its opt-in tag, profiles and exclusions', () => {
  const standards = prepareStandards(registry);
  assert.ok(standards.optInRuleTags.includes(sample.standard.ruleTag));
  for (const name of Object.keys(sample.standard.profiles)) {
    assert.deepEqual(
      sampleCore.getProfileWcagTarget(name),
      standards.profileWcagTargets[name] || null
    );
  }
  const mods = prepare();
  const { profileExcludes } = prepareProfiles(
    mods,
    prepareComposites(WCAG_COMPOSITES, { registry }),
    { registry }
  );
  assert.ok(Object.keys(profileExcludes).length > 0);
});

test('a registry holds only the standards it was made with', () => {
  const empty = createRegistry([]);
  assert.deepEqual(empty.standardMappingsFor({ id: 'x', wcagSc: ['1.1.1'] }), []);
  assert.deepEqual(empty.standardsData(), []);
  assert.equal(
    createRegistry(NORMATIVE_STANDARDS).standardsData().length,
    NORMATIVE_STANDARDS.length
  );
});

test('a standard whose profile or rule tag clashes with core is refused', () => {
  const profile = { version: '1', tags: ['wcag2a'] };
  const entry = (over) => ({
    key: 'x',
    standard: 'X',
    versions: ['1'],
    profiles: {},
    mappingsFor: () => [],
    ...over
  });
  assert.throws(
    () => prepareStandards(createRegistry([entry({ profiles: { 'wcag22-aa': profile } })])),
    /profile "wcag22-aa" is defined twice/
  );
  assert.throws(
    () => prepareStandards(createRegistry([entry({ ruleTag: 'wcag2x' })])),
    /rule tag "wcag2x" must be lowercase and not a WCAG tag/
  );
});

test('a later dictionary adds messages but cannot change an earlier one', () => {
  const merged = mergeDictionaries([
    { locale: 'fr', label: 'core/fr.json', dict: { a: 'A' } },
    { locale: 'fr', label: 'pack/fr.json', dict: { b: 'B' } }
  ]);
  assert.deepEqual(merged, { fr: { a: 'A', b: 'B' }, en: {} });
  assert.throws(
    () =>
      mergeDictionaries([
        { locale: 'en', label: 'core/en.json', dict: { a: 'A' } },
        { locale: 'en', label: 'pack/en.json', dict: { a: 'Other' } }
      ]),
    /i18n key "a" is defined in both core\/en\.json and pack\/en\.json/
  );
});
