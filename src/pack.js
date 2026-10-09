/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Packs: rules, variants of core's rules, a standard and dictionaries that
 * come from outside core, passed to a scan as engineOptions.packs. A pack is a
 * plain object (definePack documents and checks its shape); a scan with packs
 * runs on an engine of its own, over core's catalog with the packs' added,
 * prepared by the same steps the build uses (src/core/prepare-catalog.js) and
 * kept for the next scan with the same packs.
 *
 *   const { definePack } = require('@surea11y/core/pack');
 *   module.exports = definePack({
 *     name: '@acme/a11y-rules',
 *     version: '1.2.0',
 *     namespace: 'acme',          // every rule id starts with 'acme-'
 *     core: '^1.11.0',            // the core versions it works with
 *     rules: [...],               // rule modules, as core's (a `from` makes a variant)
 *     standard: {...},            // a registry entry (src/coverage/standards.js)
 *     dictionaries: { en: {...}, fr: {...} }
 *   });
 */

const core = require('./core.js');
const { version: CORE_VERSION } = require('../package.json');
const { NORMATIVE_STANDARDS, createRegistry } = require('./coverage/standards.js');
const {
  prepareStandards,
  prepareRules,
  prepareComposites,
  prepareProfiles,
  catalogHelpUrl,
  catalogData,
  toCheckDefs,
  validateCompositeMembers,
  mergeDictionaries
} = require('./core/prepare-catalog.js');
const { ruleMappedStandard } = require('./profile-kit.js');
const { wcagTags } = require('./wcag.js');

const PACK_KEYS = [
  'name',
  'version',
  'namespace',
  'core',
  'title',
  'description',
  'rules',
  'variants',
  'overrides',
  'standard',
  'profiles',
  'rollups',
  'probes',
  'dictionaries'
];

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// --- core versions ------------------------------------------------------------

function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

// Whether `version` is in `range`: one or more alternatives joined by ||, each
// '*', an exact version, ^x.y.z, ~x.y.z, or comparisons (>=, >, <=, <, =)
// separated by spaces, all of which must hold. Null for a range it can't read.
function satisfiesRange(version, range) {
  const v = parseVersion(version);
  if (!v || typeof range !== 'string' || !range.trim()) return null;
  let readable = true;
  const holds = (term) => {
    if (term === '*' || term === 'x') return true;
    const m = /^(\^|~|>=|<=|>|<|=)?\s*(v?\d+\.\d+\.\d+)$/.exec(term);
    const r = m && parseVersion(m[2]);
    if (!r) {
      readable = false;
      return false;
    }
    const c = compareVersions(v, r);
    switch (m[1]) {
      case '^':
        return (
          c >= 0 &&
          (r[0] > 0
            ? v[0] === r[0]
            : r[1] > 0
              ? v[0] === 0 && v[1] === r[1]
              : v[0] === 0 && v[1] === 0 && v[2] === r[2])
        );
      case '~':
        return c >= 0 && v[0] === r[0] && v[1] === r[1];
      case '>=':
        return c >= 0;
      case '>':
        return c > 0;
      case '<=':
        return c <= 0;
      case '<':
        return c < 0;
      default:
        return c === 0;
    }
  };
  const ok = range
    .split('||')
    .map((alt) => alt.trim().split(/\s+/).filter(Boolean))
    .some((terms) => terms.length > 0 && terms.every(holds));
  return readable ? ok : null;
}

// --- a pack's shape -------------------------------------------------------------

// What is wrong with a pack's shape, as messages; none for a pack that can be
// prepared. Whether its rules, standard and dictionaries hold together with
// core's is found by preparing it (preparePacks).
function checkPack(pack) {
  if (typeof pack === 'string') {
    return [
      `"${pack}" is a pack's name: in Node, pass the pack itself; names are for a page where packScript registered it`
    ];
  }
  if (!isObject(pack)) return ['a pack must be an object'];
  const problems = [];
  for (const key of Object.keys(pack)) {
    if (!PACK_KEYS.includes(key)) problems.push(`it has no field "${key}"`);
  }
  if (typeof pack.name !== 'string' || !pack.name.trim()) {
    problems.push('name must be a non-empty string');
  }
  if (!parseVersion(pack.version)) problems.push('version must be a version, such as "1.0.0"');
  const ns = pack.namespace;
  if (typeof ns !== 'string' || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(ns)) {
    problems.push('namespace must be lowercase letters, digits and "-", starting with a letter');
  } else if (/^wcag/.test(ns) || ns === core.ENGINE_TAG) {
    problems.push(`namespace "${ns}" is core's`);
  }
  const fits = satisfiesRange(CORE_VERSION, pack.core);
  if (fits === null) {
    problems.push('core must be a range of core versions, such as "^1.11.0"');
  } else if (!fits) {
    problems.push(`it supports core ${pack.core}, and this is core ${CORE_VERSION}`);
  }
  // Core rules the pack's rules replace, by id (decision: explicit, never
  // inferred from a shared id).
  const overrides = Array.isArray(pack.overrides) ? pack.overrides : [];
  if (pack.overrides !== undefined && !Array.isArray(pack.overrides)) {
    problems.push('overrides must be an array of core rule ids');
  }
  const own = new Set(
    (Array.isArray(pack.rules) ? pack.rules : []).filter(isObject).map((r) => r.id)
  );
  for (const id of overrides) {
    if (typeof id !== 'string' || !id.trim()) problems.push('overrides must hold rule ids');
    else if (!own.has(id)) problems.push(`overrides names ${id}, but rules has no rule ${id}`);
  }
  for (const field of ['rules', 'variants']) {
    if (pack[field] === undefined) continue;
    if (!Array.isArray(pack[field])) {
      problems.push(`${field} must be an array`);
      continue;
    }
    pack[field].forEach((rule, i) => {
      const where = `${field}[${i}]`;
      if (!isObject(rule)) return problems.push(`${where} must be a rule module`);
      if (typeof rule.id !== 'string' || !rule.id.trim()) {
        return problems.push(`${where} has no id`);
      }
      const overriding = field === 'rules' && overrides.includes(rule.id);
      if (overriding && typeof rule.runInPage !== 'function') {
        problems.push(`${where}: ${rule.id} replaces a core rule, so it needs runInPage(ctx)`);
      }
      if (typeof ns === 'string' && !overriding && !rule.id.startsWith(ns + '-')) {
        problems.push(
          `${where}: rule id "${rule.id}" must start with "${ns}-" (or be listed in overrides, to replace the core rule ${rule.id})`
        );
      }
      if (typeof rule.from !== 'string' && typeof rule.runInPage !== 'function') {
        problems.push(`${where}: ${rule.id} needs runInPage(ctx), or from for a variant`);
      }
    });
  }
  if (pack.standard !== undefined && !isObject(pack.standard)) {
    problems.push('standard must be a registry entry (an object)');
  }
  if (pack.title !== undefined && (typeof pack.title !== 'string' || !pack.title.trim())) {
    problems.push('title must be a non-empty string');
  }
  if ((pack.profiles !== undefined || pack.rollups !== undefined) && pack.standard !== undefined) {
    problems.push(
      'give profiles and rollups in standard, or a standard as profiles and rollups, not both'
    );
  }
  if (pack.profiles !== undefined) {
    if (!isObject(pack.profiles)) problems.push('profiles must be { name: { tags, exclude } }');
    else {
      for (const [name, profile] of Object.entries(pack.profiles)) {
        if (
          !isObject(profile) ||
          !Array.isArray(profile.tags) ||
          !profile.tags.every((t) => typeof t === 'string')
        ) {
          problems.push(`profiles.${name} must have tags, a list of rule tags`);
        } else if (profile.severity !== undefined && !isObject(profile.severity)) {
          problems.push(`profiles.${name}.severity must be { ruleId: severity }`);
        }
      }
    }
  }
  if (pack.rollups !== undefined) {
    if (!Array.isArray(pack.rollups)) problems.push('rollups must be an array');
    else {
      const seen = new Set();
      pack.rollups.forEach((r, i) => {
        const where = `rollups[${i}]`;
        if (!isObject(r) || typeof r.id !== 'string') return problems.push(`${where} has no id`);
        if (typeof ns === 'string' && !r.id.startsWith(ns + '-')) {
          problems.push(`${where}: rollup id "${r.id}" must start with "${ns}-"`);
        }
        if (seen.has(r.id)) problems.push(`${where}: ${r.id} is listed twice`);
        seen.add(r.id);
        if (typeof r.title !== 'string' || !r.title.trim())
          problems.push(`${where}: ${r.id} has no title`);
        if (
          !Array.isArray(r.checksIds) ||
          !r.checksIds.length ||
          !r.checksIds.every((id) => typeof id === 'string')
        ) {
          problems.push(`${where}: ${r.id} needs checksIds, the rules it groups`);
        }
      });
    }
  }
  // The probes its rules read from engineOptions.probes, documented for the
  // host that supplies them: { 'crawl.skipLinks': { description, readBy } }.
  if (pack.probes !== undefined) {
    if (!isObject(pack.probes)) problems.push('probes must be { path: { description, readBy } }');
    else {
      const ids = new Set(
        []
          .concat(Array.isArray(pack.rules) ? pack.rules : [])
          .concat(Array.isArray(pack.variants) ? pack.variants : [])
          .filter(isObject)
          .map((r) => r.id)
      );
      for (const [path, probe] of Object.entries(pack.probes)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/.test(path)) {
          problems.push(`probes: "${path}" is not a path, such as "crawl.pageTitles"`);
        } else if (
          !isObject(probe) ||
          typeof probe.description !== 'string' ||
          !probe.description.trim()
        ) {
          problems.push(`probes.${path} must have a description`);
        } else {
          for (const id of Array.isArray(probe.readBy) ? probe.readBy : []) {
            if (!ids.has(id))
              problems.push(`probes.${path}: readBy names ${id}, which is no rule of the pack`);
          }
        }
      }
    }
  }
  if (pack.dictionaries !== undefined) {
    if (!isObject(pack.dictionaries))
      problems.push('dictionaries must be { locale: { key: text } }');
    else {
      for (const [locale, dict] of Object.entries(pack.dictionaries)) {
        if (!/^[a-z]{2}(-[A-Za-z0-9]+)?$/.test(locale)) {
          problems.push(`dictionaries: "${locale}" is not a locale`);
        } else if (!isObject(dict) || Object.values(dict).some((t) => typeof t !== 'string')) {
          problems.push(`dictionaries.${locale} must map keys to strings`);
        }
      }
    }
  }
  return problems;
}

// A pack, checked: returns it, or throws a TypeError listing what is wrong.
function definePack(pack) {
  const problems = checkPack(pack);
  if (problems.length) {
    const name = isObject(pack) && typeof pack.name === 'string' ? pack.name : 'pack';
    throw new TypeError(`${name}: ${problems.join('; ')}`);
  }
  return pack;
}

const describePack = (pack) => `${pack.name}@${pack.version}`;

// What each pack brings, for a tool that lets its users choose packs: its
// identity, the ids of its rules, variants and overrides, its standard or
// checklist with their profiles and rollups, its locales and the probes its
// rules read. A pack that is not valid is described by its problems.
function describePacks(packs) {
  return (Array.isArray(packs) ? packs : [packs]).map((pack) => {
    const problems = checkPack(pack);
    if (problems.length) {
      return { name: isObject(pack) && typeof pack.name === 'string' ? pack.name : null, problems };
    }
    const ids = (list) => (list || []).map((r) => r.id);
    const overrides = (pack.overrides || []).slice();
    const standard = standardOf(pack);
    return {
      name: pack.name,
      version: pack.version,
      namespace: pack.namespace,
      core: pack.core,
      ...(pack.title ? { title: pack.title } : {}),
      ...(pack.description ? { description: pack.description } : {}),
      rules: ids((pack.rules || []).filter((r) => typeof r.from !== 'string')).filter(
        (id) => !overrides.includes(id)
      ),
      variants: ids((pack.rules || []).filter((r) => typeof r.from === 'string')).concat(
        ids(pack.variants)
      ),
      overrides,
      standard: standard
        ? {
            key: standard.key,
            standard: standard.standard,
            versions: standard.versions.slice(),
            profiles: Object.keys(standard.profiles || {}),
            rollups:
              typeof standard.composites === 'function'
                ? standard.composites().map((c) => c.id)
                : []
          }
        : null,
      locales: Object.keys(pack.dictionaries || {}).sort(),
      probes: Object.entries(pack.probes || {}).map(([path, p]) => ({
        path,
        description: p.description,
        readBy: Array.isArray(p.readBy) ? p.readBy.slice() : []
      }))
    };
  });
}

// A pack's own profiles and rollups (a checklist, say), as a standard: named
// by the pack's title, keyed and tagged by its namespace, at the pack's
// version. Its rollups carry that tag, so only its profiles produce them, and
// they show as a standard's own: their section of the HTML report, their
// SARIF tags and JUnit properties. Its rules map to none of its items: a
// rollup names the item it is.
function checklistStandard(pack) {
  const key = pack.namespace;
  const name = pack.title || pack.name;
  const version = pack.version;
  return {
    key,
    standard: name,
    versions: [version],
    profiles: Object.fromEntries(
      Object.entries(pack.profiles || {}).map(([profile, p]) => [
        profile,
        {
          version,
          tags: p.tags.concat(p.tags.includes(key) ? [] : [key]),
          ...(p.exclude ? { exclude: p.exclude } : {}),
          ...(p.severity ? { severity: p.severity } : {})
        }
      ])
    ),
    ruleTag: key,
    mappingsFor: () => [],
    composites: () =>
      (pack.rollups || []).map((r) => ({
        id: r.id,
        checksIds: r.checksIds.slice(),
        meta: {
          title: r.title,
          description: typeof r.description === 'string' ? r.description : '',
          wcagSc: [],
          level: null,
          standard: name,
          version,
          criterion: r.id,
          tags: [key],
          standardMappings: [
            { standard: name, version, requirement: r.id, title: r.title, wcagSc: [] }
          ]
        }
      }))
  };
}

// The standard a pack brings: its own, or the one its profiles and rollups make.
const standardOf = (pack) =>
  pack.standard || (pack.profiles || pack.rollups ? checklistStandard(pack) : null);

// --- an engine with packs ---------------------------------------------------------

// Core's rule modules, as the build prepared them (src/core.js lists them).
let coreEntries = null;
function coreRuleEntries() {
  if (!coreEntries) {
    coreEntries = core.__internal.ruleModules.map((spec) => {
      const mod = require(spec);
      return { file: spec, mod: mod && mod.default && mod.default.id ? mod.default : mod };
    });
  }
  return coreEntries;
}

// meta.wcagSc names the WCAG criteria a pack's rule checks, as a custom
// rule's does: the criteria normativeMappings doesn't already give become
// WCAG entries (the same rule as withWcagScMappings in resolveCustomRules,
// src/core/dom-runner.js). A built-in rule states them in normativeMappings.
function withWcagSc(mod) {
  const meta = mod && mod.meta;
  if (!meta || !Array.isArray(meta.wcagSc)) return mod;
  if (meta.normativeMappings != null && !Array.isArray(meta.normativeMappings)) return mod;
  const given = meta.normativeMappings || [];
  const have = new Set(
    given
      .filter((m) => m && String(m.standard || '').toUpperCase() === 'WCAG')
      .map((m) => String(m.requirement || '').trim())
  );
  const added = [];
  for (const v of meta.wcagSc) {
    const sc = String(v).trim();
    if (sc && !have.has(sc)) {
      have.add(sc);
      added.push({ standard: 'WCAG', requirement: sc });
    }
  }
  return added.length ? { ...mod, meta: { ...meta, normativeMappings: given.concat(added) } } : mod;
}

// An override as it is prepared: its module, with the meta it doesn't give
// taken from the core rule it replaces, so a drop-in fix runs where that rule
// would and says what it says. Related fields go together: its texts (title,
// description, i18n), its mapping (wcagSc, normativeMappings, coverage) and
// its tags are the core rule's only when it gives none of them; any other
// field is the core rule's when it doesn't give it.
const OVERRIDE_GROUPS = [
  ['title', 'description', 'i18n'],
  ['wcagSc', 'normativeMappings', 'coverage'],
  ['tags']
];
function overrideOf(coreMod, mod) {
  const own = mod.meta || {};
  const meta = { ...(coreMod.meta || {}), ...own };
  for (const group of OVERRIDE_GROUPS) {
    if (!group.some((f) => own[f] !== undefined)) continue;
    for (const f of group) if (own[f] === undefined) delete meta[f];
  }
  return { ...mod, meta };
}

// The WCAG rollups with the packs' rules where their mappings put them, as a
// custom rule counts (rollupMembers in src/core/dom-runner.js): a rule joins
// the rollup of each criterion it maps to, and an override leaves the
// rollups of criteria it no longer maps to. A WCAG rollup left with no rule
// goes; a standard's own rollups keep their lists. `rules` are the prepared
// pack rules that count: overrides, and rules without a standard's opt-in
// tag (those check what WCAG doesn't, so they never decide a WCAG verdict).
function withPackRules(composites, rules) {
  if (!rules.length) return composites;
  return composites
    .map((c) => {
      const criteria = (c.meta && !c.meta.standard && c.meta.wcagSc) || null;
      if (!criteria) return c;
      let ids = c.checksIds.slice();
      for (const r of rules) {
        const maps = (r.meta.wcagSc || []).some((sc) => criteria.includes(sc));
        if (ids.includes(r.ruleId) && !maps) ids = ids.filter((id) => id !== r.ruleId);
        else if (!ids.includes(r.ruleId) && maps) ids.push(r.ruleId);
      }
      return { ...c, checksIds: ids };
    })
    .filter((c) => c.checksIds.length);
}

// The catalog of core with the given packs, prepared as the build prepares
// core's. Throws when they do not hold together: an id or key two of them
// define, a variant of a rule that is not there, a standard whose tables do
// not match the rules.
function prepareCatalog(packs) {
  const built = core.__internal.catalog;
  const registry = createRegistry(
    NORMATIVE_STANDARDS.concat(packs.map(standardOf).filter(Boolean))
  );
  // A rule a pack lists in `overrides` takes the core rule's place: the meta
  // fields it doesn't give are the core rule's, so it runs where that rule
  // would, until its own meta says otherwise.
  const coreById = new Map(coreRuleEntries().map((e) => [e.mod.id, e.mod]));
  const overridden = new Map();
  for (const p of packs) {
    for (const id of p.overrides || []) {
      if (!coreById.has(id)) throw new Error(`${p.name} overrides ${id}, which is no core rule`);
      if (overridden.has(id)) {
        throw new Error(`${overridden.get(id)} and ${p.name} both override ${id}`);
      }
      overridden.set(id, p.name);
    }
  }
  const packEntries = packs.flatMap((p) =>
    (p.rules || []).concat(p.variants || []).map((mod) => ({
      file: `${p.name}: ${mod.id}`,
      mod: withWcagSc(
        (p.overrides || []).includes(mod.id) ? overrideOf(coreById.get(mod.id), mod) : mod
      )
    }))
  );
  const packRuleIds = new Set(packEntries.map((e) => e.mod.id));
  const coreKept = coreRuleEntries().filter((e) => !overridden.has(e.mod.id));
  const mods = prepareRules(coreKept.concat(packEntries), {
    registry,
    engineTag: core.ENGINE_TAG
  });

  const optInTags = registry.standards.map((st) => st.ruleTag).filter(Boolean);
  const composites = withPackRules(
    prepareComposites(
      built.composites.filter((c) => !(c.meta && c.meta.standard)),
      { registry }
    ),
    mods.filter(
      (m) =>
        overridden.has(m.ruleId) ||
        (packRuleIds.has(m.ruleId) && !(m.meta.tags || []).some((t) => optInTags.includes(t)))
    )
  );
  // A pack's rule links what it says; core's link its catalog section.
  const checkDefs = toCheckDefs(mods, {
    helpUrl: (id, meta) =>
      packRuleIds.has(id) ? meta.helpUrl : catalogHelpUrl(id, meta, CORE_VERSION)
  });
  validateCompositeMembers(checkDefs, composites);

  // Each rule's code: core's as built, a pack rule's own, a variant's base's.
  const modById = new Map(packEntries.map((e) => [e.mod.id, e.mod]));
  const implOf = (id) => {
    if (built.impls[id] && !packRuleIds.has(id)) return built.impls[id];
    const mod = modById.get(id);
    return {
      run: mod.runInPage,
      applicability: typeof mod.applicability === 'function' ? mod.applicability : null
    };
  };
  const impls = Object.fromEntries(
    mods.map((m) => [m.ruleId, implOf(m.variant ? m.variant.of : m.ruleId)])
  );

  // Core's dictionaries, then each pack's in order; a key two define throws.
  const i18n = mergeDictionaries(
    Object.entries(built.i18n)
      .map(([locale, dict]) => ({ locale, label: `core ${locale}`, dict }))
      .concat(
        packs.flatMap((p) =>
          Object.entries(p.dictionaries || {}).map(([locale, dict]) => ({
            locale,
            label: `${p.name} ${locale}`,
            dict
          }))
        )
      )
  );
  // A locale a pack has no dictionary for shows its messages in English, by
  // the pack's choice: they don't count as missing from that locale.
  const i18nLeftOut = JSON.parse(JSON.stringify(built.i18nLeftOut || {}));
  for (const p of packs) {
    const own = p.dictionaries || {};
    const english = Object.keys(own.en || {});
    for (const locale of Object.keys(i18n)) {
      if (locale === 'en' || own[locale] || !english.length) continue;
      const left = (i18nLeftOut[locale] = i18nLeftOut[locale] || {});
      for (const key of english) left[key] = true;
    }
  }
  const knownLocales = Array.from(new Set(built.knownLocales.concat(Object.keys(i18n)))).sort();

  return {
    checkDefs,
    composites,
    impls,
    ...catalogData({
      standards: prepareStandards(registry),
      profiles: prepareProfiles(mods, composites, { registry }),
      i18n,
      i18nLeftOut,
      knownLocales
    })
  };
}

// The engines of the last sets of packs used, by the identity of their pack
// objects: a crawl that passes the same packs to every scan prepares them once.
const ENGINE_CACHE_SIZE = 16;
const engines = new Map();
const objectIds = new WeakMap();
let nextObjectId = 1;
const idOf = (o) => {
  if (!objectIds.has(o)) objectIds.set(o, nextObjectId++);
  return objectIds.get(o);
};

// The engine for a list of packs: { runtime, packs, skipped }. A pack that is
// invalid on its own, or does not hold together with core, is skipped and
// listed with the reason (thrown under strictOptions). Packs that do not hold
// together with each other, or a name passed twice, throw: any way of
// choosing between them would depend on the order they were passed in.
function preparePacks(list, { strict = false } = {}) {
  const key = list.map((p) => (p && typeof p === 'object' ? idOf(p) : String(p))).join(',');
  const cached = engines.get(key);
  if (cached) {
    engines.delete(key);
    engines.set(key, cached);
    return cached;
  }

  const valid = [];
  const skipped = [];
  for (const pack of list) {
    let problems = checkPack(pack);
    if (!problems.length) {
      try {
        prepareCatalog([pack]);
      } catch (e) {
        problems = [e && e.message ? e.message : String(e)];
      }
    }
    if (!problems.length) {
      valid.push(pack);
      continue;
    }
    const name = isObject(pack) && typeof pack.name === 'string' ? pack.name : null;
    const reason = problems.join('; ');
    if (strict) throw new TypeError(`engineOptions.packs: ${name || 'a pack'}: ${reason}`);
    skipped.push({ name, reason });
  }
  valid.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const twice = valid.find((p, i) => i > 0 && valid[i - 1].name === p.name);
  if (twice) throw new Error(`engineOptions.packs: ${twice.name} is passed twice`);
  let catalog;
  try {
    catalog = prepareCatalog(valid);
  } catch (e) {
    throw new Error(
      `engineOptions.packs: ${valid.map(describePack).join(', ')} do not hold together: ${e && e.message ? e.message : e}`,
      { cause: e }
    );
  }
  const engine = {
    runtime: core.__internal.createRuntime(catalog),
    catalog,
    packs: valid.map(describePack),
    // The core rules the packs replace, by id.
    overrides: valid.flatMap((p) => p.overrides || []).sort(),
    skipped
  };
  engines.set(key, engine);
  if (engines.size > ENGINE_CACHE_SIZE) engines.delete(engines.keys().next().value);
  return engine;
}

// --- packs in a page ------------------------------------------------------------------

// A function's source as an expression: a method written as `runInPage(ctx)
// { ... }` is not one on its own, so it is read back from an object literal.
function functionExpression(fn) {
  const src = fn.toString();
  const isExpression =
    /^(async\s+)?function\b/.test(src) ||
    /^(async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(src) ||
    /^class\b/.test(src);
  return isExpression ? `(${src})` : `({ ${src} })[${JSON.stringify(fn.name)}]`;
}

const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// A script that registers the packs in a page, after core's browser bundle or
// before a page.evaluate(runa11yCoreInPage, ...): runa11yCoreInPage then runs
// on their catalog when engineOptions.packs names them as name@version
// (engine.packs of a scan in Node lists the names). The catalog is prepared
// here, in Node; the page gets it as data and the packs' rules' code as
// functions written into the script, never as strings to evaluate, so it runs
// under a Content Security Policy that forbids eval. A rule's code must
// therefore be self-contained, as core's rules are. A pack that is not valid
// throws.
function packScript(packs) {
  const engine = preparePacks(Array.isArray(packs) ? packs : [packs], { strict: true });
  const { catalog } = engine;
  const built = core.__internal.catalog;
  const impls = Object.entries(catalog.impls).map(([id, impl]) => {
    const coreId = Object.keys(built.impls).find((k) => built.impls[k] === impl);
    const value = coreId
      ? JSON.stringify(coreId)
      : `{ run: ${functionExpression(impl.run)}, applicability: ${
          impl.applicability ? functionExpression(impl.applicability) : 'null'
        } }`;
    return `    ${JSON.stringify(id)}: ${value}`;
  });
  // The page has core's dictionaries; the packs' messages are added to them.
  const i18n = {};
  for (const p of Array.isArray(packs) ? packs : [packs]) {
    for (const [locale, dict] of Object.entries(p.dictionaries || {})) {
      i18n[locale] = Object.assign(i18n[locale] || {}, dict);
    }
  }
  const data = { ...catalog, i18n };
  delete data.impls;
  const key = engine.packs.slice().sort().join(',');
  return [
    `// Packs for @surea11y/core in a page: ${engine.packs.join(', ')}.`,
    '// Generated by packScript (@surea11y/core/pack); name them in engineOptions.packs.',
    '(function (global) {',
    "  'use strict';",
    '  const registry = global.__surea11yPacks || (global.__surea11yPacks = {});',
    `  const data = ${scriptJson(data)};`,
    `  registry[${JSON.stringify(key)}] = Object.assign(data, {`,
    `    packs: ${JSON.stringify(engine.packs)},`,
    `    overrides: ${JSON.stringify(engine.overrides)},`,
    '    impls: {',
    impls.join(',\n'),
    '    }',
    '  });',
    "})(typeof globalThis !== 'undefined' ? globalThis : this);",
    ''
  ].join('\n');
}

// Core's browser bundle with the packs registered after it: one file to inject
// into a page, for a product that ships its own bundle.
function buildBrowserBundle({ packs = [] } = {}) {
  const fs = require('fs');
  const bundle = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');
  return packs.length ? `${bundle}\n${packScript(packs)}` : bundle;
}

module.exports = {
  definePack,
  checkPack,
  describePacks,
  packScript,
  buildBrowserBundle,
  preparePacks,
  satisfiesRange,
  ruleMappedStandard,
  wcagTags
};
