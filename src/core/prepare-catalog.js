/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The catalog an engine is built from, prepared from its sources: the rules
 * (core's and each standard's), the rollups, the standards registry and the
 * dictionaries. scripts/build-core.js finds the sources on disk and inlines
 * what these functions return into the generated core; nothing here reads a
 * file, so the same steps can run on sources given at run time.
 *
 * Every function takes the registry it works with (createRegistry in
 * src/coverage/standards.js), never the built-in one, and throws on a problem
 * with the sources, naming each one. `where` prefixes those messages (the
 * build passes '[build-core]').
 */

const { normalizeRuleMeta } = require('./rule-meta');
const { resolveVariants } = require('./rule-variants');
const { wcagTags } = require('../wcag');

// The WCAG profiles core defines itself, by tag set; a standard's profiles
// come from the registry.
const WCAG_PROFILE_TAGS = {
  'wcag22-aa': ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
  section508: ['wcag2a', 'wcag2aa']
};

const tagged = (where, message) => (where ? `${where} ${message}` : message);

// The WCAG target a profile's tag set comes to, when it is the tag set of a
// WCAG version up to a level (wcagTags): wcag22-aa is WCAG 2.2 Level AA. A
// profile whose tags are not such a set has none.
function profileWcagTarget(tags) {
  for (const version of ['2.0', '2.1', '2.2']) {
    for (const levels of [['A'], ['A', 'AA'], ['A', 'AA', 'AAA']]) {
      const set = wcagTags(version, levels);
      if (set.length === tags.length && set.every((t) => tags.includes(t))) {
        return { version, level: levels[levels.length - 1] };
      }
    }
  }
  return null;
}

// The registry's tables, as the generated core reads them: the standards
// engineOptions.mappings can switch on, the opt-in rule tags, the profiles
// and their WCAG targets. Throws on a malformed key or rule tag, and on a
// standard key or profile name defined twice.
function prepareStandards(registry, { where = '' } = {}) {
  const standardsData = registry.standardsData();
  for (const s of standardsData) {
    if (s.ruleTag && (!/^[a-z0-9-]+$/.test(s.ruleTag) || /^wcag/.test(s.ruleTag))) {
      throw new Error(
        tagged(where, `rule tag "${s.ruleTag}" must be lowercase and not a WCAG tag`)
      );
    }
    if (!/^[a-z0-9-]+$/.test(s.key)) {
      throw new Error(
        tagged(where, `standard key "${s.key}" must be lowercase letters, digits or '-'`)
      );
    }
  }
  const keys = standardsData.map((s) => s.key);
  const profileNames = Object.keys(WCAG_PROFILE_TAGS).concat(
    standardsData.flatMap((s) => Object.keys(s.profiles))
  );
  for (const [what, names] of [
    ['standard key', keys],
    ['profile', profileNames]
  ]) {
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) throw new Error(tagged(where, `${what} "${dup}" is defined twice`));
  }

  const standardProfiles = Object.fromEntries(
    standardsData.flatMap((s) =>
      Object.entries(s.profiles).map(([name, p]) => [
        name,
        {
          tags: p.tags,
          mappings: [s.key + ':' + p.version],
          target: { key: s.key, standard: s.standard, version: p.version }
        }
      ])
    )
  );
  const pick = (field) =>
    Object.fromEntries(Object.entries(standardProfiles).map(([n, p]) => [n, p[field]]));

  return {
    standardsData,
    normativeMappingStandards: Object.fromEntries(
      standardsData.map((s) => [s.key, { standard: s.standard, versions: s.versions }])
    ),
    // Tags of rules that run only when asked for: see ruleTag in the registry.
    optInRuleTags: standardsData.filter((s) => s.ruleTag).map((s) => s.ruleTag),
    ruleMappedStandards: standardsData.filter((s) => s.ruleMapped).map((s) => s.standard),
    restatedPrefixes: Object.fromEntries(
      standardsData.filter((s) => s.restatedPrefixes).map((s) => [s.standard, s.restatedPrefixes])
    ),
    // What a reporter needs to show each standard, in registry order: the
    // note above its own rollups and the language of their titles. A result
    // carries those of the standards it names (runCore), so it renders
    // without the registry.
    standardReports: registry.standards.map((s) => {
      const report = (s && s.report) || {};
      return {
        key: s.key,
        standard: s.standard,
        ...(report.titleLang ? { titleLang: String(report.titleLang) } : {}),
        ...(report.noteKey ? { noteKey: String(report.noteKey) } : {})
      };
    }),
    standardProfiles,
    profileTags: pick('tags'),
    // The standard's own rule tag among a profile's tags: it selects the
    // rules and rollups the standard brings, never core's, which may carry
    // a tag of the same name (best-practice, forms).
    profileOwnTags: Object.fromEntries(
      standardsData.flatMap((s) =>
        s.ruleTag
          ? Object.entries(s.profiles)
              .filter(([, p]) => (p.tags || []).includes(s.ruleTag))
              .map(([name]) => [name, [s.ruleTag]])
          : []
      )
    ),
    profileMappings: pick('mappings'),
    profileTargets: pick('target'),
    profileWcagTargets: Object.fromEntries(
      Object.entries({ ...WCAG_PROFILE_TAGS, ...pick('tags') })
        .map(([name, tags]) => [name, profileWcagTarget(tags)])
        .filter(([, target]) => target)
    )
  };
}

function describeKeys(obj) {
  if (!obj || typeof obj !== 'object') return 'N/A';
  try {
    return Object.keys(obj).sort().join(', ') || '(no keys)';
  } catch {
    return '(uninspectable)';
  }
}

function assertString(name, value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function assertJsonSerializable(name, value) {
  if (value === undefined) return null; // normalize undefined -> null (stable output)
  try {
    JSON.stringify(value);
    return value;
  } catch (e) {
    throw new Error(`${name} must be JSON-serializable. ${e && e.message ? e.message : e}`, {
      cause: e
    });
  }
}

// Every rule, prepared from its module: [{ file, mod }], `file` being where
// the module came from (a path for the build) and `mod` what it exports.
// Variants are resolved against their bases, meta is normalised with every
// registered standard's entries added, and the standards' tables are checked
// against the rules. Returns them sorted by id. Throws on a rule that cannot
// be used, an id defined twice (naming both files through `describeFile`) and
// a problem in a standard's tables.
function prepareRules(entries, { registry, engineTag, where = '', describeFile = String }) {
  const fileById = new Map();
  const modByFile = new Map(entries.map((e) => [e.file, e.mod]));

  // A variant (src/core/rule-variants.js) runs its base rule's code with
  // settings of its own; resolve each against its base first.
  const resolved = resolveVariants(entries);
  if (resolved.problems.length) {
    throw new Error(tagged(where, `rule variants:\n  ${resolved.problems.join('\n  ')}`));
  }

  const mods = [];
  const coreFiles = new Set(entries.filter((e) => e.core).map((e) => e.file));
  for (const { file, mod } of resolved.modules) {
    if (!mod || typeof mod !== 'object') {
      throw new Error(`Rule ${file} must export an object (got ${typeof mod})`);
    }

    const id = assertString(`Rule ${file} export "id"`, mod.id);

    if (typeof mod.runInPage !== 'function') {
      throw new Error(`Rule ${file} must export runInPage(ctx). Found keys: ${describeKeys(mod)}`);
    }

    const meta = mod.meta && typeof mod.meta === 'object' ? mod.meta : {};

    const ruleId = id;

    const runFnSource = mod.runInPage.toString();

    const applicabilityFn = typeof mod.applicability === 'function' ? mod.applicability : null;

    const applicabilityFnSource =
      typeof applicabilityFn === 'function' ? applicabilityFn.toString() : null;

    const normalizedMeta = normalizeRuleMeta(ruleId, id, meta, engineTag);
    // Other standards' entries (src/coverage/standards.js) are derived here
    // rather than declared per rule, so a rule only ever states its WCAG
    // mapping.
    normalizedMeta.normativeMappings = registry.withStandardMappings(
      normalizedMeta.normativeMappings,
      ruleId
    );

    const data = assertJsonSerializable(`Rule ${ruleId}: export "data"`, mod.data);

    if (fileById.has(ruleId)) {
      throw new Error(
        tagged(
          where,
          `rule id "${ruleId}" is defined twice: ${describeFile(fileById.get(ruleId))} and ${describeFile(file)}`
        )
      );
    }
    fileById.set(ruleId, file);

    // The settings the rule's code reads from ctx.config (the base's, for a
    // variant). The runner keeps a caller's config from setting them.
    const codeMod = mod.variant ? modByFile.get(mod.variant.file) : mod;
    const settingNames =
      codeMod && codeMod.settings && typeof codeMod.settings === 'object'
        ? Object.keys(codeMod.settings)
        : [];

    mods.push({
      file,
      // Core's own rule: never a standard's opt-in rule, whatever its tags.
      core: coreFiles.has(file),
      // The file whose runInPage runs: the base rule's, for a variant.
      codeFile: mod.variant ? mod.variant.file : file,
      settings: settingNames,
      id,
      ruleId,
      runFnSource,
      applicabilityFnSource,
      meta: normalizedMeta,
      data,
      variant: mod.variant
        ? { of: mod.variant.of, config: mod.variant.config, messages: mod.variant.messages }
        : null
    });
  }

  mods.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId, undefined, { numeric: true, sensitivity: 'base' })
  );

  // A standard mapped rule by rule names rules and requirements by id;
  // a typo or a mapping to an unrelated criterion fails here.
  const problems = registry
    .validateStandards(mods.map((m) => ({ ruleId: m.ruleId, wcagSc: m.meta.wcagSc || [] })))
    .concat(
      registry.validateProfileIndependence(
        mods.map((m) => ({
          ruleId: m.ruleId,
          wcagSc: m.meta.wcagSc || [],
          tags: m.meta.tags || [],
          core: m.core,
          variantOf: m.variant ? m.variant.of : null
        }))
      )
    );
  if (problems.length) {
    throw new Error(tagged(where, `normative mappings:\n  ${problems.join('\n  ')}`));
  }
  return mods;
}

// The rollups: core's WCAG rollups as given (an array of { id, checksIds,
// meta }), each with every registered standard's entries for its criteria,
// then each standard's own. Throws on an entry without an id or rules, and
// on an id used twice.
function prepareComposites(wcagEntries, { registry, where = '' }) {
  const seen = new Set();
  const wcag = wcagEntries.map((entry, idx) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(tagged(where, `composite rule entry at index ${idx} must be an object`));
    }

    const id = String(entry.id || '').trim();
    const checksIds = Array.isArray(entry.checksIds)
      ? entry.checksIds.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (!id) throw new Error(tagged(where, `composite rule entry at index ${idx} is missing "id"`));
    if (seen.has(id)) throw new Error(tagged(where, `duplicate composite rule id: ${id}`));
    if (!checksIds.length)
      throw new Error(tagged(where, `composite rule "${id}" must include at least one testId`));

    seen.add(id);

    return {
      id,
      checksIds,
      meta:
        entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
          ? {
              ...entry.meta,
              standardMappings: registry.standardMappingsFor({
                id,
                wcagSc: entry.meta.wcagSc,
                checksIds
              })
            }
          : null
    };
  });

  // Rollups a standard defines for itself (one per requirement, say), with the
  // entries they already carry. Opt-in through their meta.tags.
  const own = registry.standardComposites().map((entry) => ({
    id: entry.id,
    checksIds: entry.checksIds.slice(),
    meta: { ...entry.meta }
  }));
  for (const entry of own) {
    if (seen.has(entry.id))
      throw new Error(tagged(where, `duplicate composite rule id: ${entry.id}`));
    seen.add(entry.id);
  }
  return wcag.concat(own);
}

const SEVERITIES = ['minor', 'moderate', 'serious', 'critical'];

// What the profiles run beyond their tags, given the prepared rules and
// rollups: `profileRules`, the rules each profile with `mappedRules` runs by
// id; `profileExcludes`, what each profile with `exclude` leaves out; and
// `profileSeverity`, the severity each profile with `severity` gives a rule
// in place of the rule's own. An unknown rule or severity throws.
function prepareProfiles(mods, composites, { registry, where = '' }) {
  const rules = mods.map((m) => ({ ruleId: m.ruleId, wcagSc: m.meta.wcagSc || [] }));
  const known = new Set(rules.map((r) => r.ruleId));
  const profileSeverity = {};
  const problems = [];
  for (const s of registry.standardsData()) {
    for (const [name, p] of Object.entries(s.profiles)) {
      if (p.rules !== undefined) {
        if (!Array.isArray(p.rules) || !p.rules.every((id) => typeof id === 'string')) {
          problems.push(`${name}: rules must be a list of rule ids`);
        } else {
          for (const id of p.rules) {
            if (!known.has(id)) problems.push(`${name}: rules names ${id}, which is no rule`);
          }
        }
      }
      if (!p.severity) continue;
      // A level is read in any case ("Critical"), as a rule's own is.
      const levels = {};
      for (const [ruleId, given] of Object.entries(p.severity)) {
        const level = typeof given === 'string' ? given.toLowerCase() : given;
        if (!known.has(ruleId))
          problems.push(`${name}: severity names ${ruleId}, which is no rule`);
        else if (!SEVERITIES.includes(level)) {
          problems.push(`${name}: severity of ${ruleId} must be one of ${SEVERITIES.join(', ')}`);
        } else levels[ruleId] = level;
      }
      profileSeverity[name] = levels;
    }
  }
  if (problems.length) throw new Error(tagged(where, `profiles:\n  ${problems.join('\n  ')}`));
  return {
    profileSeverity,
    profileRules: registry.profileRuleIds(rules),
    profileExcludes: registry.profileExclusions(
      rules,
      (Array.isArray(composites) ? composites : [])
        .filter((c) => c && c.meta && !c.meta.standard)
        .map((c) => ({ id: c.id, wcagSc: (c.meta && c.meta.wcagSc) || [] }))
    )
  };
}

// A built-in rule with no help link of its own that maps to no WCAG
// criterion, so has no Understanding document to link either, links its
// section of docs/RULE_CATALOG.md at the release tag of `engineVersion`: the
// text there describes the rule that ran.
function catalogHelpUrl(ruleId, meta, engineVersion) {
  const own = meta && typeof meta.helpUrl === 'string' ? meta.helpUrl.trim() : '';
  if (own) return meta.helpUrl;
  const mapsToCriterion =
    (Array.isArray(meta && meta.wcagSc) && meta.wcagSc.length > 0) ||
    (Array.isArray(meta && meta.normativeMappings) &&
      meta.normativeMappings.some(
        (m) => m && !m.type && m.requirement && (m.standard == null || m.standard === 'WCAG')
      ));
  if (mapsToCriterion) return meta ? meta.helpUrl : undefined;
  return (
    'https://github.com/SureA11y/core/blob/v' +
    engineVersion +
    '/docs/RULE_CATALOG.md#' +
    String(ruleId).toLowerCase()
  );
}

// The catalog's data besides its rules, their code and its rollups: what the
// generated runtime reads as CATALOG.* (createRuntime). `standards` is what
// prepareStandards returns, `profiles` what prepareProfiles returns,
// `i18nLeftOut` the keys each locale leaves out by choice, as
// { locale: { key: true } }.
function catalogData({ standards, profiles, optInOwned, i18n, i18nLeftOut, knownLocales }) {
  return {
    i18n: i18n || { en: {} },
    i18nLeftOut,
    knownLocales,
    profileTags: standards.profileTags,
    profileWcagTargets: standards.profileWcagTargets,
    normativeMappingStandards: standards.normativeMappingStandards,
    ruleMappedStandards: standards.ruleMappedStandards,
    restatedPrefixes: standards.restatedPrefixes,
    standardReports: standards.standardReports,
    optInRuleTags: standards.optInRuleTags,
    optInOwned: optInOwned || {},
    profileOwnTags: standards.profileOwnTags || {},
    profileRules: profiles.profileRules,
    profileExcludes: profiles.profileExcludes,
    profileSeverity: profiles.profileSeverity || {},
    profileMappings: standards.profileMappings,
    profileTargets: standards.profileTargets
  };
}

// The rules and rollups that run only when their standard is asked for, by
// id, with the standard's rule tag: a rule a standard brings (not core's)
// and a standard's own rollup, each carrying that tag. A core rule whose tag
// has the same name is not one of them, so a standard can't switch it off.
function optInOwnership(mods, composites, standards) {
  const ruleTags = standards.optInRuleTags;
  const out = {};
  const own = (id, tags) => {
    const optIn = (tags || [])
      .map((t) => String(t).toLowerCase())
      .filter((t) => ruleTags.includes(t));
    if (optIn.length) out[id] = optIn;
  };
  for (const m of mods) if (!m.core) own(m.ruleId, m.meta.tags);
  for (const c of composites) if (c && c.meta && c.meta.standard) own(c.id, c.meta.tags);
  return out;
}

// The catalog entry of each prepared rule, as CHECK_DEFS holds it.
// `helpUrl(ruleId, meta)` gives its help link.
function toCheckDefs(mods, { helpUrl }) {
  return mods.map((m) => ({
    ruleId: m.ruleId,
    title: m.meta.title,
    description: m.meta.description,
    i18n: m.meta.i18n,
    helpUrl: helpUrl(m.ruleId, m.meta),
    tags: m.meta.tags,
    wcagSc: Array.isArray(m.meta.wcagSc) ? m.meta.wcagSc : [],
    normativeMappings: m.meta.normativeMappings,
    defaultSeverity: m.meta.defaultSeverity,
    defaultConfidence: m.meta.defaultConfidence,
    type: m.meta.type,
    coverage: m.meta.coverage,

    // Optional rule metadata payload for apps/AI (JSON-serializable)
    data: m.data === undefined ? null : m.data,

    // contract fields
    ruleInterfaceVersion: m.meta.ruleInterfaceVersion,
    ruleVersion: m.meta.ruleVersion,
    normative: m.meta.normative,
    atomic: m.meta.atomic,
    deprecated: m.meta.deprecated,
    deprecation: m.meta.deprecation,
    category: m.meta.category,
    standard: m.meta.standard,
    applicability: m.meta.applicability,
    expectation: m.meta.expectation,
    references: m.meta.references,
    requirements: m.meta.requirements,
    mappings: m.meta.mappings,
    // What the rule measures against a threshold (src/core/margin.js), or null.
    margin: m.meta.margin,

    // A variant: the base rule it runs, its settings and its message prefix
    // (src/core/rule-variants.js). The runner reads both.
    ...(m.variant ? { variant: m.variant } : {}),
    // The settings the rule's code reads (its own, or its base's).
    ...(m.settings && m.settings.length ? { settings: m.settings } : {})
  }));
}

// Every rule a rollup names must be one of the given catalog entries.
function validateCompositeMembers(defs, composites, { where = '' } = {}) {
  const knownRuleIds = new Set(defs.map((d) => d.ruleId));
  for (const cr of Array.isArray(composites) ? composites : []) {
    if (!cr || typeof cr !== 'object') continue;
    const cid = String(cr.id || '').trim();
    const ids = Array.isArray(cr.checksIds) ? cr.checksIds : [];
    for (const tid of ids) {
      const rid = String(tid || '').trim();
      if (!rid) continue;
      if (!knownRuleIds.has(rid)) {
        throw new Error(tagged(where, `composite rule "${cid}" references unknown testId: ${rid}`));
      }
    }
  }
}

// One dictionary per locale from dictionary files given in order
// ([{ locale, label, dict }], `label` naming the file in a message). Throws on
// a key two files of one locale define, so a later source can add messages but
// never change an earlier one's. `en` is always present.
function mergeDictionaries(files) {
  const out = {};
  const owner = {};
  for (const { locale, label, dict } of files) {
    const merged = (out[locale] = out[locale] || {});
    const seen = (owner[locale] = owner[locale] || {});
    for (const [key, value] of Object.entries(dict)) {
      if (key in merged) {
        throw new Error(`i18n key "${key}" is defined in both ${seen[key]} and ${label}`);
      }
      merged[key] = value;
      seen[key] = label;
    }
  }
  if (!out.en) out.en = {};
  return out;
}

module.exports = {
  WCAG_PROFILE_TAGS,
  profileWcagTarget,
  prepareStandards,
  prepareRules,
  prepareComposites,
  prepareProfiles,
  catalogHelpUrl,
  catalogData,
  optInOwnership,
  toCheckDefs,
  validateCompositeMembers,
  mergeDictionaries
};
