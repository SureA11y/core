'use strict';

/**
 * Build the generated core (src/core.js) from rule modules under src/checks
 * and under each profile's rules folder (scripts/lib/rule-dirs.js).
 *
 * IMPORTANT DESIGN GOAL:
 * - The exported `runa11yCoreInPage` MUST be self-contained (no free vars),
 *   because consumers execute it via `page.evaluate(runa11yCoreInPage, ...)`.
 *
 * Non-public engine: we DO NOT preserve legacy/back-compat paths here.
 *
 * Supported rule module shape (only):
 *   module.exports = {
 *     id: 'myRule',
 *     meta: { ... },
 *     runInPage(ctx) { ... },
 *     applicability?(ctx) { return boolean | { applicable:boolean, reason?:string } }
 *   }
 *
 * * runOnly supports (legacy + extended):
 *  * - legacy reference-engine-like: { type:'tag', values:[...] }
 *  * - { includeMode?: 'and'|'or' }
 *  * - { tags?: string[] }                 (include tags)
 *  * - { excludeTags?: string[] }
 *  * - { includeRuleIds?: string[] }       (can include composite ids)
 *  * - { excludeRuleIds?: string[] }       (can exclude composite ids)
 *  * - { includeTestIds?: string[] }       (atomic test ids)
 *  * - { excludeTestIds?: string[] }
 */

const fs = require('fs');
const path = require('path');

const { POLICY_CONTRACTS } = require('../src/policy/contracts');
const { resolvePolicy } = require('../src/policy/resolvePolicy');
const {
  normalizeSelectorList,
  describeOptionValue,
  resolveContextRoots,
  createDomHelpers
} = require('../src/core/dom-helpers');
const {
  engineOptionSpec,
  checkEngineOptions,
  enforceEngineOptions,
  strictOf,
  switchOf
} = require('../src/core/engine-options');
const {
  isThenable,
  assertPageBuiltins,
  resolveCustomRules,
  runCore,
  runCoreSettled,
  settleAnimations,
  rollupCompositeResults,
  rollupMembers,
  readRenderingEnvironment
} = require('../src/core/dom-runner');
const {
  createSafeDom,
  SAFE_DOM_GETTERS,
  SAFE_DOM_METHODS,
  SAFE_DOM_OTHER_NAMES
} = require('../src/core/safe-dom');
const { createContrastHelpers } = require('../src/core/contrast-helpers');
const { createAriaHelpers } = require('../src/core/aria-helpers');
const { normalizeRuleMeta } = require('../src/core/rule-meta');
const { NORMATIVE_STANDARDS, createRegistry } = require('../src/coverage/standards');
const {
  prepareStandards,
  prepareRules,
  prepareComposites,
  prepareProfiles,
  catalogHelpUrl,
  catalogData,
  optInOwnership,
  toCheckDefs,
  validateCompositeMembers
} = require('../src/core/prepare-catalog');
const {
  UNCERTAINTY_CODE_VALUES,
  isUncertaintyCode,
  normalizeUncertainty
} = require('../src/core/uncertainty');
const { resolveMargin, getMargins } = require('../src/core/margin');
const {
  FRAME_RPC_CHANNEL,
  getFrameRpcRegistry,
  installFrameRpcListener,
  nextFrameRpcRequestId,
  pingFrame,
  sendFrameRunCommand,
  enableFrameRpcResponder
} = require('../src/core/frame-messaging');
const {
  findChildFrameElements,
  engineOptionsForFrames,
  isFrameShown,
  isFrameExcluded,
  getFrameElementSelector,
  describeFrameElement,
  getFrameElementUrl,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder
} = require('../src/core/frame-scan');
const { waitForPageReady } = require('../src/core/page-ready');
const { ruleDirs, CORE_RULES_DIR } = require('./lib/rule-dirs');
const { loadDictionaries, keysLeftOut } = require('./lib/dictionaries');

const ENGINE_TAG = 'a11ycore';
const SCHEMA_VERSION = '1.0.0';
// The package version, baked in at build time so a result says which release
// produced it (engine.version). A version bump needs a rebuild; a test checks
// the two agree.
const ENGINE_VERSION = require('../package.json').version;

// A rule's help link (catalogHelpUrl in src/core/prepare-catalog.js), at this
// version's release tag.
const helpUrlOf = (ruleId, meta) => catalogHelpUrl(ruleId, meta, ENGINE_VERSION);
const { WCAG_CRITERIA, wcagLinks, wcagTitle } = require('../src/coverage/wcag-criteria');

// The built-in registry (src/coverage/standards.js) and its tables, emitted
// into the generated core: the standards engineOptions.mappings can switch on,
// and the conformance profiles they bring. See resolveMappingSelection and
// CONFORMANCE_PROFILES there.
const REGISTRY = createRegistry(NORMATIVE_STANDARDS);
const STANDARDS = prepareStandards(REGISTRY, { where: '[build-core]' });
// Each criterion's level in WCAG 2.0, 2.1 and 2.2, null where that version
// does not have it, which also says when it was added and removed.
const WCAG_LEVELS_BY_SC = Object.fromEntries(
  WCAG_CRITERIA.map((c) => [c.sc, ['2.0', '2.1', '2.2'].map((v) => c.levels[v] || null)])
);
// The WCAG entry a custom rule's meta.wcagSc stands for, in the latest
// version that has the criterion, as a built-in rule states it: version,
// title, level and links.
const WCAG_MAPPING_BY_SC = Object.fromEntries(
  WCAG_CRITERIA.map((c) => {
    const version = c.levels['2.2'] ? '2.2' : c.levels['2.1'] ? '2.1' : '2.0';
    const links = wcagLinks(c.sc, version) || {};
    return [
      c.sc,
      {
        version,
        title: wcagTitle(c.sc, version),
        conformanceLevel: c.levels[version],
        ...(links.url ? { url: links.url, understandingUrl: links.understandingUrl } : {})
      }
    ];
  })
);

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const RULES_DIRS = ruleDirs();
const OUTPUT_FILE = path.join(SRC_DIR, 'core.js');

const CATALOGS_DIR = path.join(SRC_DIR, 'catalogs');
const COMPOSITE_RULES_FILE = path.join(CATALOGS_DIR, 'composites.wcag.js');

function loadCompositeRulesCatalog() {
  if (!fs.existsSync(COMPOSITE_RULES_FILE)) return [];

  const raw = require(COMPOSITE_RULES_FILE);

  if (!Array.isArray(raw)) {
    throw new Error(
      `[build-core] ${path.relative(ROOT_DIR, COMPOSITE_RULES_FILE)} must export an array`
    );
  }

  return prepareComposites(raw, { registry: REGISTRY, where: '[build-core]' });
}

// Core's dictionaries and each profile's, merged per locale
// (scripts/lib/dictionaries.js). A key two of them define fails the build.
function loadAllTranslations() {
  return loadDictionaries();
}

// The keys each locale leaves out by a folder's choice, as the generated code
// reads them: { locale: { key: true } }.
function leftOutMap(leftOut) {
  const out = {};
  for (const [locale, keys] of Object.entries(leftOut || {})) {
    out[locale] = Object.fromEntries(keys.map((k) => [k, true]));
  }
  return out;
}

function isRuleFileName(fullPath) {
  const base = path.basename(fullPath);

  // Exclude ONLY a rules folder's top-level index (src/checks/index.*),
  // but allow nested index.js (e.g. src/checks/manual-review/index.js)
  const isTopLevelIndex =
    RULES_DIRS.includes(path.dirname(fullPath)) &&
    (base === 'index.js' || base === 'index.cjs' || base === 'index.mjs');

  if (isTopLevelIndex) return false;

  if (base.endsWith('.test.js') || base.endsWith('.test.cjs') || base.endsWith('.test.mjs'))
    return false;

  return base.endsWith('.js') || base.endsWith('.cjs');
}

function listRuleFilesRecursive(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });

  for (const ent of entries) {
    const full = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...listRuleFilesRecursive(full));
    else if (ent.isFile() && isRuleFileName(full)) out.push(full);
  }

  return out;
}

function safeRequire(file) {
  try {
    return require(file);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    e.message = `Failed to require rule module: ${file}\n${e.message}`;
    throw e;
  }
}

function inlineConstFunction(name, fn) {
  if (typeof fn !== 'function') throw new Error(`${name} must be a function`);
  const src = fn.toString();
  if (!src.includes('{') || src.includes('[native code]')) {
    throw new Error(`${name} is not serializable to source`);
  }
  return `const ${name} = (${src});`;
}

function unwrapModule(mod) {
  // Helps with transpiled/ESM-interop outputs that put the object under "default".
  if (mod && typeof mod === 'object' && mod.default && typeof mod.default === 'object') {
    const looksLikeRule =
      typeof mod.id === 'string' || typeof mod.runInPage === 'function'
        ? true
        : typeof mod.default.id === 'string' && typeof mod.default.runInPage === 'function';
    return looksLikeRule && typeof mod.default.id === 'string' ? mod.default : mod;
  }
  return mod;
}

// Every rule module in the given rules folders (core's and each profile's by
// default), as prepareRules takes them: [{ file, mod }].
// core: the rule is core's own, from src/checks, not a profile's.
function ruleModuleEntries(dirs = RULES_DIRS) {
  return dirs.flatMap((dir) =>
    listRuleFilesRecursive(dir).map((file) => ({
      file,
      mod: unwrapModule(safeRequire(file)),
      core: path.resolve(dir) === path.resolve(CORE_RULES_DIR)
    }))
  );
}

// Every rule in the given rules folders, prepared (src/core/prepare-catalog.js).
// A rule id defined twice fails the build, naming both files: the engine would
// otherwise list and run both under one id.
function loadRuleModules(dirs = RULES_DIRS) {
  return prepareRules(ruleModuleEntries(dirs), {
    registry: REGISTRY,
    engineTag: ENGINE_TAG,
    where: '[build-core]',
    describeFile: (file) => path.relative(ROOT_DIR, file)
  });
}

function jsStringify(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Generate src/core.js as a single CommonJS module.
 */
function generateCore(mods, i18nAll, compositeRulesCatalog, knownLocalesArg, leftOutArg) {
  // Defaults to the inlined set; the browser build inlines only en but still
  // passes the full list, so an omitted table reports dictionary-not-loaded
  // rather than pretending the language does not exist.
  const knownLocales = (knownLocalesArg || Object.keys(i18nAll || { en: {} })).slice().sort();

  // Rules a profile runs by id on top of its tags (see mappedRules in the
  // registry), and what each profile with `exclude` leaves out, as rule and
  // rollup ids; unknown names fail the build.
  const profiles = prepareProfiles(mods, compositeRulesCatalog, {
    registry: REGISTRY,
    where: '[build-core]'
  });

  const defs = toCheckDefs(mods, { helpUrl: helpUrlOf });

  const COMPOSITE_RULES = Array.isArray(compositeRulesCatalog) ? compositeRulesCatalog : [];

  // The catalog's data besides the rules and rollups: what the shared runtime
  // reads as CATALOG.* (createRuntime in the Node module, and the in-page
  // runner's own copy).
  const data = catalogData({
    standards: STANDARDS,
    profiles,
    optInOwned: optInOwnership(mods, COMPOSITE_RULES, STANDARDS),
    i18n: i18nAll,
    i18nLeftOut: leftOutMap(leftOutArg),
    knownLocales
  });

  // Validate composite checks against the loaded atomic checks (fail fast at build time)
  validateCompositeMembers(defs, COMPOSITE_RULES, { where: '[build-core]' });

  // Node/runtime implementations (require at runtime in Node, used by checks and server-side use).
  // Normalize to a single shape: { run, applicability }
  const implEntries = mods.map((m) => {
    const rel = path.relative(SRC_DIR, m.codeFile || m.file).replace(/\\/g, '/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    return `  ${jsStringify(m.ruleId)}: { run: require(${jsStringify(spec)}).runInPage, applicability: require(${jsStringify(spec)}).applicability || null }`;
  });

  const specOf = (file) => {
    const rel = path.relative(SRC_DIR, file).replace(/\\/g, '/');
    return rel.startsWith('.') ? rel : './' + rel;
  };
  const ruleModuleSpecs = mods.map((m) => specOf(m.file));

  // In-page implementations (inline function sources; used ONLY by runa11yCoreInPage).
  // Same normalized shape: { run, applicability }
  const implEntriesInPage = mods.map((m) => {
    const app = m.applicabilityFnSource ? `(${m.applicabilityFnSource})` : 'null';
    return `    ${jsStringify(m.ruleId)}: { run: (${m.runFnSource}), applicability: ${app} }`;
  });

  const runnersSharedSource = `
const DEFAULT_POLICY = {
  allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
  allowedConfidence: ['high', 'medium', 'low'],
  coerceManualFailToCantTell: true
};

// Built-in message catalogs (inlined at build time)
const I18N = CATALOG.i18n;

// Per locale, the keys a dictionary folder leaves out by having no file for
// that locale (a profile that does not offer the language): they show in
// English, and do not make the locale's dictionary look incomplete.
const I18N_LEFT_OUT = CATALOG.i18nLeftOut;

// Every locale the project ships, whether or not its table was inlined here.
// Lets an absent dictionary be told apart from a language that does not exist.
const KNOWN_LOCALES = CATALOG.knownLocales;

function normalizeLocale(locale) {
  if (typeof locale !== 'string') return 'en';
  const s = locale.trim();
  return s ? s : 'en';
}

// Dictionaries supplied by the caller. This function is serialized into the
// page, so a table that was not compiled in can only arrive as data.
function getSuppliedMessages(engineOptions) {
  const supplied = engineOptions && engineOptions.messages;
  return (supplied && typeof supplied === 'object' && !Array.isArray(supplied)) ? supplied : null;
}

// Own properties only. A bare lookup would accept inherited names, so
// { locale: 'constructor' } or '__proto__' would resolve to something that is
// not a dictionary and get reported as the locale in use.
function ownDict(table, locale) {
  if (!table || !Object.prototype.hasOwnProperty.call(table, locale)) return null;

  const dict = table[locale];
  return (dict && typeof dict === 'object' && !Array.isArray(dict)) ? dict : null;
}

function lookupDict(locale, engineOptions) {
  return ownDict(getSuppliedMessages(engineOptions), locale) || ownDict(I18N, locale);
}

// Locale codes are case-insensitive, so pt-br has to find pt-BR. Only reached
// when the exact lookup misses, and the tables hold one entry per language.
function matchIgnoringCase(table, locale) {
  if (!table) return null;

  const lower = locale.toLowerCase();
  for (const key in table) {
    if (key.toLowerCase() === lower && ownDict(table, key)) return key;
  }
  return null;
}

function findLocaleKey(locale, engineOptions) {
  if (lookupDict(locale, engineOptions)) return locale;

  return (
    matchIgnoringCase(getSuppliedMessages(engineOptions), locale) ||
    matchIgnoringCase(I18N, locale)
  );
}

// Exact code first, then its primary subtag, so de-DE uses de when no de-DE
// table exists. t() runs this per string, and an exact hit returns before any
// allocation or scan.
function matchLocale(requested, engineOptions) {
  const direct = findLocaleKey(requested, engineOptions);
  if (direct) return direct;

  const primary = requested.split('-')[0];
  return primary.toLowerCase() === requested.toLowerCase()
    ? null
    : findLocaleKey(primary, engineOptions);
}

function getLocaleDict(engineOptions) {
  const requested = normalizeLocale(engineOptions && engineOptions.locale);
  const matched = matchLocale(requested, engineOptions);

  return matched ? lookupDict(matched, engineOptions) : (I18N && I18N.en ? I18N.en : {});
}

function ownString(dict, key) {
  if (!dict || !Object.prototype.hasOwnProperty.call(dict, key)) return null;
  return (typeof dict[key] === 'string' && dict[key]) ? dict[key] : null;
}

// A caller-supplied dictionary layers over the built-in one for the same
// locale rather than replacing it, so overriding one string does not cost the
// caller every other string in that language.
function localeMessage(key, engineOptions) {
  const matched = matchLocale(normalizeLocale(engineOptions && engineOptions.locale), engineOptions);
  if (!matched) return null;

  return (
    ownString(ownDict(getSuppliedMessages(engineOptions), matched), key) ||
    ownString(ownDict(I18N, matched), key)
  );
}

function isKnownLocale(locale) {
  if (KNOWN_LOCALES.indexOf(locale) !== -1) return true;

  const primary = locale.split('-')[0].toLowerCase();
  return primary !== locale && KNOWN_LOCALES.indexOf(primary) !== -1;
}

// Reports which dictionary the run actually used, so a locale that fell back
// is visible in the result rather than only in the wording. Shares matchLocale
// with getLocaleDict, so the reported locale and the strings cannot disagree.
function resolveLocale(engineOptions) {
  const requested = normalizeLocale(engineOptions && engineOptions.locale);
  const matched = matchLocale(requested, engineOptions);

  if (!matched) {
    return {
      requested: requested,
      resolved: 'en',
      reason: isKnownLocale(requested) ? 'dictionary-not-loaded' : 'unknown-locale'
    };
  }

  const en = (I18N && I18N.en) ? I18N.en : {};
  const dict = lookupDict(matched, engineOptions);

  if (!dict) return { requested: requested, resolved: 'en', reason: 'unknown-locale' };

  if (dict !== en) {
    const supplied = ownDict(getSuppliedMessages(engineOptions), matched);
    const builtIn = ownDict(I18N, matched);

    const leftOut = I18N_LEFT_OUT[matched] || {};

    for (const key in en) {
      if (leftOut[key] === true) continue;
      if (!ownString(supplied, key) && !ownString(builtIn, key)) {
        return { requested: requested, resolved: matched, reason: 'partial-dictionary' };
      }
    }
  }

  // Differing only in case is not a fallback -- the caller got the language
  // they asked for.
  return {
    requested: requested,
    resolved: matched,
    reason: matched.toLowerCase() === requested.toLowerCase() ? 'ok' : 'primary-subtag'
  };
}

  function isTruthyMustache(val) {
    if (val === false || val === null || val === undefined) return false;
    if (typeof val === 'number') return val !== 0 && !Number.isNaN(val);
    if (typeof val === 'string') return val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }

  function renderMustacheLite(template, params) {
    const str = (typeof template === 'string') ? template : '';
    const ctx = (params && typeof params === 'object') ? params : null;
    if (!str || !ctx) return str;

    // Tokenize: {{...}}. A key never contains a brace; leaving braces out of
    // it keeps a long run of them from making the match slow.
    const tagRe = /\\{\\{\\s*([#^/]?)([^{}\\s]+)\\s*\\}\\}/g;

    // We render by building an AST-like stack of frames (small + deterministic).
    const root = { type: 'root', key: null, inverted: false, parts: [] };
    const stack = [root];

    let lastIndex = 0;
    let m;

    while ((m = tagRe.exec(str)) !== null) {
      const before = str.slice(lastIndex, m.index);
      if (before) stack[stack.length - 1].parts.push({ type: 'text', value: before });

      const sigil = m[1];           // '', '#', '^', '/'
      const rawKey = m[2] || '';
      const key = String(rawKey).trim();

      if (!key) {
        // Treat empty tags as literal text (no-throw).
        stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        lastIndex = tagRe.lastIndex;
        continue;
      }

      if (sigil === '#') {
        const frame = { type: 'section', key, inverted: false, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '^') {
        const frame = { type: 'section', key, inverted: true, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '/') {
        // Close section if it matches; otherwise treat as literal.
        const top = stack[stack.length - 1];
        if (top && top.type === 'section' && top.key === key) {
          stack.pop();
        } else {
          stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        }
      } else {
        // Variable
        stack[stack.length - 1].parts.push({ type: 'var', key });
      }

      lastIndex = tagRe.lastIndex;
    }

    // Tail text
    const tail = str.slice(lastIndex);
    if (tail) stack[stack.length - 1].parts.push({ type: 'text', value: tail });

    // If we have unclosed sections, we *don’t throw*; we just render them as literal
    // by flattening them with their original markers removed. (Deterministic.)
    function evalParts(parts) {
      let out = '';
      for (const p of parts) {
        if (!p || typeof p !== 'object') continue;
        if (p.type === 'text') out += p.value || '';
        else if (p.type === 'var') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : '';
          out += (v === null || v === undefined) ? '' : String(v);
        } else if (p.type === 'section') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : undefined;
          const ok = isTruthyMustache(v);
          const shouldRender = p.inverted ? !ok : ok;
          if (shouldRender) out += evalParts(p.parts || []);
        }
      }
      return out;
    }

    return evalParts(root.parts);
  }

  function applyI18nParams(str, params) {
    return renderMustacheLite(str, params);
  }


function t(key, fallback, params, engineOptions) {
  if (typeof key !== 'string' || !key.trim()) return typeof fallback === 'string' ? fallback : '';

  const v = localeMessage(key, engineOptions);

  // fallback to English if missing in requested locale
  const vEn = ownString(I18N && I18N.en, key);

  const base = v || vEn || (typeof fallback === 'string' ? fallback : '');

  return applyI18nParams(base, params);
}

function resolveRuleDefI18n(def, engineOptions) {
  if (!def || typeof def !== 'object') return def;
  const out = { ...def };
  if (out.i18n && typeof out.i18n === 'object') {
    out.title = t(out.i18n.titleKey, out.title, null, engineOptions);
    out.description = t(out.i18n.descriptionKey, out.description, null, engineOptions);
  }
  return out;
}

const POLICY_CONTRACTS = ${jsStringify(POLICY_CONTRACTS)};

// This is the single source of truth, inlined from src/policy/resolvePolicy.js
${inlineConstFunction('resolvePolicy', resolvePolicy)}

// An option value as text, or '' for one that has none (an object without a
// prototype, a Symbol), which a list then leaves out instead of the scan
// failing on it.
function optionText(value) {
  try {
    return String(value);
  } catch {
    return '';
  }
}

function parseCommaList(value, { lower = false } = {}) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const arr = value.map(optionText).map((s) => s.trim()).filter(Boolean);
    const norm = lower ? arr.map((s) => s.toLowerCase()) : arr.slice();
    // de-dupe while preserving first-seen order (deterministic)
    const seen = new Set();
    const out = [];
    for (const v of norm) {
      if (!seen.has(v)) { seen.add(v); out.push(v); }
    }
    return out;
  }
  if (typeof value !== 'string') return [];
  const raw = value.split(',').map((s) => String(s).trim()).filter(Boolean);
  const norm = lower ? raw.map((s) => s.toLowerCase()) : raw.slice();
  const seen = new Set();
  const out = [];
  for (const v of norm) {
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

function normalizeIncludeMode(mode) {
  const m = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return m === 'or' ? 'or' : 'and';
}

function hasAnyRunOnlyKeys(runOnly) {
  if (!runOnly || typeof runOnly !== 'object') return false;

  // legacy reference-engine-like: { type:'tag', values:[...] }
  const hasLegacyTag =
    runOnly.type === 'tag' && Array.isArray(runOnly.values) && runOnly.values.length > 0;

  // parseCommaList accepts an array or a comma-separated string, so this gate
  // has to as well -- ENGINE_OPTIONS.md states these fields mirror their
  // engineOptions counterparts, which have always taken a string.
  const hasEntries = (value) => parseCommaList(value).length > 0;

  const hasAnyFilters =
    hasLegacyTag ||
    (runOnly.wcag !== undefined && runOnly.wcag !== null) ||
    runOnly.bestPractices === true ||
    hasEntries(runOnly.tags) ||
    hasEntries(runOnly.excludeTags) ||
    hasEntries(runOnly.includeRuleIds) ||
    hasEntries(runOnly.excludeRuleIds) ||
    hasEntries(runOnly.includeTestIds) ||
    hasEntries(runOnly.excludeTestIds);

  // IMPORTANT: includeMode by itself should NOT cause runOnly to take precedence.
  return hasAnyFilters;
}

/**
 * Normalize the selection object used at runtime.
 *
 * Supported inputs:
 * - legacy runOnly object (arrays)
 * - legacy reference-engine-like runOnly: { type:'tag', values:[...] }
 * - extended runOnly: { includeMode:'and'|'or', excludeTags:[...] }
 *
 * Output shape:
 * { includeMode, tags, excludeTags, includeRuleIds, excludeRuleIds, includeTestIds, excludeTestIds }
 */
function normalizeRunOnly(runOnly) {
  const out = {
    includeMode: 'and',
    tags: [],
    excludeTags: [],
    includeRuleIds: [],
    excludeRuleIds: [],
    includeTestIds: [],
    excludeTestIds: [],
    optInTags: [],
    ownTags: [],
    wcag: null,
    bestPractices: false
  };
  if (!runOnly || typeof runOnly !== 'object') return out;

  // A WCAG conformance target, { version, level }, checked by
  // resolveEffectiveRunOnly (checkWcagTarget).
  out.wcag = normalizeWcagTarget(runOnly.wcag);
  // The best-practice rules, those that name no WCAG criterion.
  out.bestPractices = runOnly.bestPractices === true;

  out.includeMode = normalizeIncludeMode(runOnly.includeMode);
  // The opt-in rule tags engineOptions.optInRules unlocked, carried by a
  // selection resolveEffectiveRunOnly built.
  out.optInTags = parseCommaList(runOnly.optInTags, { lower: true }).filter((t) =>
    OPT_IN_RULE_TAGS.includes(t)
  );
  // A standard profile's own tag, set by applyProfile.
  out.ownTags = parseCommaList(runOnly.ownTags, { lower: true }).filter((t) =>
    OPT_IN_RULE_TAGS.includes(t)
  );

  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values)) {
    out.tags = parseCommaList(runOnly.values, { lower: true });
    return out;
  }

  out.tags = parseCommaList(runOnly.tags, { lower: true });
  out.excludeTags = parseCommaList(runOnly.excludeTags, { lower: true });

  out.includeRuleIds = parseCommaList(runOnly.includeRuleIds, { lower: false });
  out.excludeRuleIds = parseCommaList(runOnly.excludeRuleIds, { lower: false });
  
  out.includeTestIds = parseCommaList(runOnly.includeTestIds, { lower: false });
  out.excludeTestIds = parseCommaList(runOnly.excludeTestIds, { lower: false });

  return out;
}

/**
 * Named conformance targets for engineOptions.profile, each the version-origin
 * tag set a caller would otherwise have to spell out (level tags do not nest,
 * see docs/WCAG_CONFORMANCE.md). The WCAG target version then follows from the
 * tags the usual way, so a profile needs no version of its own.
 *
 * - wcag22-aa: WCAG 2.2 Level A and AA.
 * - section508: the Revised 508 Standards incorporate WCAG 2.0 A and AA.
 * - plus the profiles a registered standard brings (src/coverage/standards.js),
 *   such as en301549-v4.1.1 and en301549-v3.2.1.
 *
 * A profile only selects which rules run. It is not a claim that passing them
 * satisfies the standard it is named after.
 */
const CONFORMANCE_PROFILES = {
  'wcag22-aa': ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
  'section508': ['wcag2a', 'wcag2aa'],
  ...CATALOG.profileTags
};

// The WCAG target each profile's tag set comes to, { version, level }, for a
// caller that selects by runOnly.wcag instead: { 'wcag22-aa': { version:
// '2.2', level: 'AA' }, ... }. A profile still selects by its tags.
const PROFILE_WCAG_TARGETS = Object.freeze(
  Object.fromEntries(
    Object.entries(CATALOG.profileWcagTargets).map(([name, target]) => [name, Object.freeze(target)])
  )
);

// The WCAG target a conformance profile comes to, { version, level }, or null
// for a name that is no profile or a profile that is no WCAG version and
// level: getProfileWcagTarget('wcag22-aa') is { version: '2.2', level: 'AA' }.
function getProfileWcagTarget(profile) {
  const name = normalizeProfileName(profile);
  return Object.prototype.hasOwnProperty.call(PROFILE_WCAG_TARGETS, name)
    ? { ...PROFILE_WCAG_TARGETS[name] }
    : null;
}

// WCAG's success criteria by number (src/coverage/wcag-criteria.js), each
// with its level in WCAG 2.0, 2.1 and 2.2, null where that version does not
// have it (not yet added, or removed). runOnly.wcag selects rules by it.
const WCAG_LEVELS_BY_SC = ${JSON.stringify(WCAG_LEVELS_BY_SC)};
const WCAG_MAPPING_BY_SC = ${JSON.stringify(WCAG_MAPPING_BY_SC)};
// A criterion's tag is its number without dots: wcag1412 for 1.4.12.
const WCAG_SC_BY_TAG = Object.fromEntries(
  Object.keys(WCAG_LEVELS_BY_SC).map((sc) => ['wcag' + sc.split('.').join(''), sc])
);
const WCAG_TARGET_VERSIONS = ['2.0', '2.1', '2.2'];
// The tag of the rules runOnly.bestPractices selects.
const BEST_PRACTICE_TAG = 'best-practice';
const WCAG_TARGET_LEVELS = ['A', 'AA', 'AAA'];

// The nine WCAG version/level tags, wcag2a to wcag22aaa, each a version and
// a level. Known whether or not a rule carries one: a tag no rule carries
// names criteria the engine has no rule for, not a typo.
const WCAG_LEVEL_TAGS = (function () {
  const out = Object.create(null);
  const prefix = { '2.0': 'wcag2', '2.1': 'wcag21', '2.2': 'wcag22' };
  for (const version of WCAG_TARGET_VERSIONS) {
    for (const level of WCAG_TARGET_LEVELS) out[prefix[version] + level.toLowerCase()] = { version, level };
  }
  return out;
})();

// runOnly.wcag as given, { version, level }, checked: anything else throws.
// The level is matched case-insensitively.
function checkWcagTarget(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidRunOnly('runOnly.wcag must be an object { version, level }, not ' + JSON.stringify(value) + '.');
  }
  const version = typeof value.version === 'string' ? value.version.trim() : value.version;
  if (!WCAG_TARGET_VERSIONS.includes(version)) {
    throw invalidRunOnly(
      'runOnly.wcag.version must be "2.0", "2.1" or "2.2", ' +
        (value.version === undefined ? 'and is missing.' : 'not ' + JSON.stringify(value.version) + '.')
    );
  }
  const level = typeof value.level === 'string' ? value.level.trim().toUpperCase() : value.level;
  if (!WCAG_TARGET_LEVELS.includes(level)) {
    throw invalidRunOnly(
      'runOnly.wcag.level must be "A", "AA" or "AAA", ' +
        (value.level === undefined ? 'and is missing.' : 'not ' + JSON.stringify(value.level) + '.')
    );
  }
  return { version, level };
}

// The same, for a selection already checked: a valid target, or null.
function normalizeWcagTarget(value) {
  try {
    return value == null ? null : checkWcagTarget(value);
  } catch {
    return null;
  }
}

// Whether a criterion is part of a WCAG target: in force in its version (added
// in it or before, not removed in it or before), at its level or below, by
// the level the criterion has in that version.
function criterionInWcagTarget(sc, target) {
  const levels = Object.prototype.hasOwnProperty.call(WCAG_LEVELS_BY_SC, sc) ? WCAG_LEVELS_BY_SC[sc] : null;
  const level = levels && levels[WCAG_TARGET_VERSIONS.indexOf(target.version)];
  return !!level && WCAG_TARGET_LEVELS.indexOf(level) <= WCAG_TARGET_LEVELS.indexOf(target.level);
}

// The criteria a rule names: its criterion tags (wcag1412), and its wcagSc,
// which a rollup names its criteria by.
function wcagCriteriaOfDef(def) {
  const out = [];
  for (const t of Array.isArray(def.tags) ? def.tags : []) {
    const tag = String(t).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(WCAG_SC_BY_TAG, tag)) out.push(WCAG_SC_BY_TAG[tag]);
  }
  const details = def.data && def.data.details;
  for (const list of [def.wcagSc, details && details.wcagSc]) {
    for (const sc of Array.isArray(list) ? list : []) out.push(String(sc).trim());
  }
  return out;
}

function normalizeProfileName(v) {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

/**
 * Standards engineOptions.mappings can add to a result's normativeMappings
 * next to WCAG, keyed by the name a caller writes, with the \`standard\` their
 * entries carry and the versions the engine has a table for. A result carries
 * only the WCAG entries unless one is asked for: a clause of a standard the
 * caller does not audit against is noise in every report.
 */
const NORMATIVE_MAPPING_STANDARDS = CATALOG.normativeMappingStandards;

// A profile a standard brings switches that standard's mappings on, for the
// version it targets, so asking for the target is enough.
// Standards whose entries come from each rule (ruleMapped in the registry),
// by the name their entries carry. A rollup keeps only the entries of the
// rules that produced its outcome (rollupCompositeResults).
const RULE_MAPPED_STANDARDS = CATALOG.ruleMappedStandards;

// For a rule-mapped standard, the prefixes of its requirements that restate a
// WCAG criterion one for one (restatedPrefixes in the registry): a rollup names
// those whatever rule decided it.
const RESTATED_PREFIXES = CATALOG.restatedPrefixes;

// What a reporter needs to show each registered standard, in registry order:
// { key, standard, titleLang?, noteKey? }. A result carries those of the
// standards it names, its note in the scan's language (result.standards).
const STANDARD_REPORTS = CATALOG.standardReports;

// Rules tagged with one of these check a standard's own requirements, ones
// WCAG does not make (src/coverage/standards.js, ruleTag). They are opt-in:
// ruleMatchesRunOnly selects them only when the selection names the tag or
// the rule itself, which a standard's profile does.
const OPT_IN_RULE_TAGS = CATALOG.optInRuleTags;
// The rules and rollups those tags make opt-in, by id: the ones a standard
// brings. A core rule carrying a tag of the same name isn't one of them.
const OPT_IN_OWNED = CATALOG.optInOwned || {};
// A standard profile's own rule tag, which selects that standard's rules and
// rollups only, kept out of the tags it selects by.
const PROFILE_OWN_TAGS = CATALOG.profileOwnTags || {};

// The opt-in tags of a rule or rollup: those of the standard that brought it,
// or, for a custom rule, the opt-in tags it carries.
function optInTagsOf(def) {
  if (def && def.custom) {
    const tags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];
    return tags.filter((t) => OPT_IN_RULE_TAGS.includes(t));
  }
  const id = def && typeof def.ruleId === 'string' ? def.ruleId : '';
  return Object.prototype.hasOwnProperty.call(OPT_IN_OWNED, id) ? OPT_IN_OWNED[id] : [];
}

// Rules a profile also runs by id, whatever their tags: every rule its
// standard maps for the profile's version (mappedRules in the registry).
const PROFILE_RULES = CATALOG.profileRules;

// What a profile leaves out (exclude in the registry): { rules, criteria }
// as declared, and the rule and rollup ids they come to. Applied with the
// profile, as its own exclusions, so the scan and the catalog agree.
const PROFILE_EXCLUDES = CATALOG.profileExcludes;

// The severity a profile gives a rule in place of the rule's own (severity in
// a profile of the registry), by profile and rule id.
const PROFILE_SEVERITY = CATALOG.profileSeverity || {};

const PROFILE_MAPPINGS = CATALOG.profileMappings;

// The standard and version each standard's profile targets. Under one, that
// standard's own rollups are its version's only: a standard with two
// versions has a rollup per requirement in each.
const PROFILE_TARGETS = CATALOG.profileTargets;

// What a rule sees as ctx.standard: the standard and version the run's
// profile targets, { key, name, version }, or null when no standard's
// profile selected the run (no profile, a WCAG one, or tags alone).
function profileStandardOf(profile) {
  const target =
    typeof profile === 'string' && Object.prototype.hasOwnProperty.call(PROFILE_TARGETS, profile)
      ? PROFILE_TARGETS[profile]
      : null;
  return target
    ? Object.freeze({ key: target.key, name: target.standard, version: target.version })
    : null;
}

// Whether a standard's own rollup belongs to the version the selection's
// profile targets. A rollup of another standard, or a selection with no
// standard's profile, is not concerned.
function rollupInProfileVersion(standard, version, selection) {
  const profile = selection && typeof selection.profile === 'string' ? selection.profile : null;
  const target =
    profile && Object.prototype.hasOwnProperty.call(PROFILE_TARGETS, profile)
      ? PROFILE_TARGETS[profile]
      : null;
  if (!target || !standard || standard !== target.standard) return true;
  return !version || version === target.version;
}

/**
 * Resolve engineOptions.mappings (an array or comma-separated string of
 * "name" or "name:version", names and versions matched case-insensitively)
 * plus whatever the applied profile implies.
 *
 * Returns { tokens, unknown }: tokens are the canonical selections in table
 * order ("en301549" for every version, or "en301549:V3.2.1" for one), with a
 * version dropped when its whole standard is also selected; unknown lists
 * what the caller wrote that names no standard or version the engine has.
 */
function resolveMappingSelection(engineOptions, appliedProfile) {
  const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  const requested = parseCommaList(eo.mappings, { lower: false });
  if (appliedProfile && Object.prototype.hasOwnProperty.call(PROFILE_MAPPINGS, appliedProfile)) {
    requested.push(...PROFILE_MAPPINGS[appliedProfile]);
  }

  const whole = new Set();
  const versions = Object.create(null);
  const unknown = [];
  for (const token of requested) {
    const sep = token.indexOf(':');
    const name = (sep < 0 ? token : token.slice(0, sep)).trim().toLowerCase();
    const std = Object.prototype.hasOwnProperty.call(NORMATIVE_MAPPING_STANDARDS, name)
      ? NORMATIVE_MAPPING_STANDARDS[name]
      : null;
    if (!std) {
      unknown.push(token);
      continue;
    }
    if (sep < 0) {
      whole.add(name);
      continue;
    }
    const wanted = token.slice(sep + 1).trim().toLowerCase();
    const version = std.versions.find((v) => v.toLowerCase() === wanted);
    if (!version) {
      unknown.push(token);
      continue;
    }
    (versions[name] = versions[name] || new Set()).add(version);
  }

  const tokens = [];
  for (const name of Object.keys(NORMATIVE_MAPPING_STANDARDS)) {
    if (whole.has(name)) tokens.push(name);
    else if (versions[name]) {
      for (const v of NORMATIVE_MAPPING_STANDARDS[name].versions) {
        if (versions[name].has(v)) tokens.push(name + ':' + v);
      }
    }
  }
  return { tokens, unknown };
}

// A normativeMappings list with the entries of every optional standard the
// selection does not ask for removed. WCAG entries, and entries for any
// standard the engine does not add itself, always stay.
function filterNormativeMappings(list, tokens) {
  if (!Array.isArray(list)) return list;
  const keep = Object.create(null);
  for (const token of tokens) {
    const sep = token.indexOf(':');
    const name = sep < 0 ? token : token.slice(0, sep);
    const std = NORMATIVE_MAPPING_STANDARDS[name];
    if (!std) continue;
    keep[std.standard] = keep[std.standard] || new Set();
    for (const v of sep < 0 ? std.versions : [token.slice(sep + 1)]) keep[std.standard].add(v);
  }
  const optional = new Set(
    Object.keys(NORMATIVE_MAPPING_STANDARDS).map((k) => NORMATIVE_MAPPING_STANDARDS[k].standard)
  );
  return list.filter((m) => {
    if (!m || typeof m !== 'object' || !optional.has(m.standard)) return true;
    return !!(keep[m.standard] && keep[m.standard].has(m.version));
  });
}

// A profile supplies the include tags of a selection that includes nothing
// of its own. Excludes are left alone, whichever route they came by, so a
// runOnly that only excludes (a binding's disableTags(), say) narrows the
// profile rather than replacing it, and runOnly.bestPractices adds the
// best-practice rules to it.
function applyProfile(selection, requestedProfile) {
  if (!requestedProfile) return selection;
  const profileTags = Object.prototype.hasOwnProperty.call(CONFORMANCE_PROFILES, requestedProfile)
    ? CONFORMANCE_PROFILES[requestedProfile]
    : null;
  if (!profileTags) {
    selection.profileNotApplied = 'unknown';
  } else if (
    // runOnly.bestPractices is no such include: it adds the best-practice
    // rules to what the rest selects, the profile here.
    selection.wcag ||
    selection.tags.length ||
    selection.includeRuleIds.length ||
    selection.includeTestIds.length
  ) {
    selection.profileNotApplied = 'overridden';
  } else {
    const ownTags = Object.prototype.hasOwnProperty.call(PROFILE_OWN_TAGS, requestedProfile)
      ? PROFILE_OWN_TAGS[requestedProfile]
      : [];
    selection.tags = profileTags.filter((t) => !ownTags.includes(t));
    selection.ownTags = ownTags.slice();
    // A profile that also names rules selects a rule matching either.
    if (Object.prototype.hasOwnProperty.call(PROFILE_RULES, requestedProfile)) {
      selection.includeRuleIds = PROFILE_RULES[requestedProfile].slice();
      selection.includeMode = 'or';
    }
    if (Object.prototype.hasOwnProperty.call(PROFILE_EXCLUDES, requestedProfile)) {
      const ex = PROFILE_EXCLUDES[requestedProfile];
      const ids = ex.ruleIds.concat(ex.rollupIds);
      selection.excludeRuleIds = selection.excludeRuleIds.concat(
        ids.filter((id) => !selection.excludeRuleIds.includes(id))
      );
      if (ex.rules.length || ex.criteria.length) {
        selection.profileExcludes = { rules: ex.rules.slice(), criteria: ex.criteria.slice() };
      }
    }
    selection.profile = requestedProfile;
  }
  return selection;
}

// engineOptions.optInRules unlocks opt-in rules outside their standard's
// profile: 'all' for every opt-in rule tag, or a list of tags. It
// only opens the gate in ruleMatchesRunOnly; the rest of the selection still
// decides, so a default run then runs every rule and a WCAG profile still
// runs WCAG rules only. What it names that is no opt-in tag is kept as
// "optInTagsUnknown" for the runner to warn about.
function applyOptInRules(selection, requested) {
  if (requested == null || requested === false) return selection;
  const list = parseCommaList(requested, { lower: true });
  if (!list.length) {
    // An empty string or list asks for nothing; any other value is not a tag list.
    if (typeof requested !== 'string' && !Array.isArray(requested)) {
      selection.optInTagsUnknown = [optionText(requested)];
    }
    return selection;
  }
  const all = list.includes('all');
  const unknown = list.filter((t) => t !== 'all' && !OPT_IN_RULE_TAGS.includes(t));
  selection.optInTags = all
    ? OPT_IN_RULE_TAGS.slice()
    : OPT_IN_RULE_TAGS.filter((t) => list.includes(t));
  if (unknown.length) selection.optInTagsUnknown = unknown;
  return selection;
}

/**
 * Resolve effective selection from engineOptions (preferred) or runOnly (legacy).
 *
 * Precedence:
 * - If runOnly is provided and non-empty => use it (legacy behavior, plus extended fields)
 * - Else => derive from engineOptions.rules/tags/includeMode (comma-separated strings)
 * - engineOptions.profile supplies the include tags only when the winning
 *   selection includes nothing; its excludes still apply on top of it.
 *
 * When a profile was requested, the result carries either "profile" (the one
 * applied) or "profileNotApplied" ('unknown' | 'overridden') so the runner
 * can report which.
 */
// runOnly given as a bare array or string, as axe-core takes it: rule ids
// (built-in, composite or engineOptions.customRules) select those rules, and
// anything else is read as tags. A mix, or a value that is neither a known
// rule id nor a known tag, is an error, so a typo can't quietly run every
// rule or none.
// The rule ids (built-in, composite or engineOptions.customRules) and tags a
// selection can name, as two tests.
function knownSelectionNames(engineOptions) {
  const customRules = engineOptions ? engineOptions.customRules : undefined;
  const ruleIds = new Set();
  const tags = new Set();
  for (const d of CHECK_DEFS) {
    if (d && d.ruleId) ruleIds.add(String(d.ruleId));
    for (const t of (d && Array.isArray(d.tags) ? d.tags : [])) tags.add(String(t).toLowerCase());
  }
  // The custom rules the scan would run, read as the runner reads them
  // (resolveCustomRules: ids trimmed, tags as given). A rule it would skip
  // names nothing, and says why.
  const resolved = resolveCustomRules(customRules, CHECK_DEFS, COMPOSITE_RULES, ENGINE_TAG);
  for (const d of resolved.defs.values()) {
    ruleIds.add(d.ruleId);
    for (const t of Array.isArray(d.tags) ? d.tags : []) tags.add(String(t).toLowerCase());
  }
  const skippedReasons = new Map();
  for (const sk of resolved.skipped) if (sk.id && !skippedReasons.has(sk.id)) skippedReasons.set(sk.id, sk.reason);
  return {
    // '"acme-x"', or with why a custom rule of that id was skipped.
    describe: (v) =>
      '"' + v + '"' +
      (skippedReasons.has(String(v).trim()) && !ruleIds.has(String(v).trim())
        ? ' (a custom rule that was skipped: ' + skippedReasons.get(String(v).trim()) + ')'
        : ''),
    isRuleId: (v) =>
      !!compositeIdOf(v) || [...ruleIds].some((id) => ruleIdMatches(v, id, ENGINE_TAG)),
    isTag: (v) => tags.has(String(v).toLowerCase()),
    // A WCAG version/level tag no rule carries: a real tag, for criteria the
    // engine has no rule for, not a typo.
    isUntestedWcagTag: (v) => {
      const t = String(v).toLowerCase();
      return !tags.has(t) && Object.prototype.hasOwnProperty.call(WCAG_LEVEL_TAGS, t);
    }
  };
}

// 'WCAG 2.2 Level A ("wcag22a")', for messages.
function describeWcagLevelTag(tag) {
  const t = WCAG_LEVEL_TAGS[String(tag).toLowerCase()];
  return 'WCAG ' + t.version + ' Level ' + t.level + ' ("' + tag + '")';
}

function invalidRunOnly(message) {
  const err = new Error(message);
  err.code = 'INVALID_RUN_ONLY';
  return err;
}

function expandRunOnlyShorthand(runOnly, engineOptions) {
  if (!Array.isArray(runOnly) && typeof runOnly !== 'string') return runOnly;
  const values = parseCommaList(runOnly, { lower: false });
  if (!values.length) return null;

  const { isRuleId, isTag, isUntestedWcagTag, describe } = knownSelectionNames(engineOptions);
  const asRules = values.filter(isRuleId);
  const unknown = values.filter((v) => !isRuleId(v) && !isTag(v) && !isUntestedWcagTag(v));
  if (unknown.length) {
    throw invalidRunOnly(
      'runOnly: no rule or tag named ' + unknown.map(describe).join(', ') + '.'
    );
  }
  if (asRules.length === values.length) return { includeRuleIds: values };
  if (asRules.length === 0) return { tags: values.map((v) => v.toLowerCase()) };
  throw invalidRunOnly(
    'runOnly: an array lists either rule ids or tags, not both; use { includeRuleIds, tags } to combine them.'
  );
}

// The object form of runOnly, and engineOptions.rules / .tags, name rules and
// tags in lists. An include list that names only things that don't exist
// selects nothing from it, so a typo could run no rule and pass a CI gate:
// that throws, as the bare-array form does. A name that doesn't exist beside
// ones that do is warned about, and an unknown name in an exclude list too.
// A WCAG version/level tag no rule carries (wcag22a) is no such name: in an
// include list it is noted with console.info, which
// engineOptions.logUntestedWcag: false leaves out, and in an exclude list it
// is left alone.
function checkSelectionNames(lists, engineOptions, { otherIncludes = false } = {}) {
  let known = null;
  for (const { field, values, kind, include } of lists) {
    if (!Array.isArray(values) || !values.length) continue;
    known = known || knownSelectionNames(engineOptions);
    const test = kind === 'rule' ? known.isRuleId : known.isTag;
    const missing = values.filter((v) => !test(v));
    if (!missing.length) continue;
    // A WCAG version/level tag no rule carries selects nothing either, but it
    // is no typo: it is said so, and never warned about as one.
    const untested = kind === 'tag' ? missing.filter(known.isUntestedWcagTag) : [];
    const unknown = missing.filter((v) => !untested.includes(v));
    const names = unknown.map(known.describe).join(', ');
    const levels = untested.map(describeWcagLevelTag).join(' or ');
    // A WCAG target (runOnly.wcag) or runOnly.bestPractices selects rules of
    // its own, so tags that select none are not a run of no rules there; a
    // typo still is.
    if (include && missing.length === values.length && !(otherIncludes && !unknown.length)) {
      if (!untested.length) throw invalidRunOnly(field + ': no ' + kind + ' named ' + names + '.');
      throw invalidRunOnly(
        field +
          ': ' +
          (unknown.length ? 'no ' + kind + ' named ' + names + ', and ' : '') +
          'no rules for ' +
          levels +
          ', so no rule would run; ' +
          (untested.length > 1 ? 'their' : 'its') +
          ' criteria need manual review.'
      );
    }
    if (unknown.length) {
      try {
        console.warn('[surea11y] ' + field + ': no ' + kind + ' named ' + names + '; ignored.');
      } catch {}
    }
    if (include && untested.length && !(engineOptions && engineOptions.logUntestedWcag === false)) {
      try {
        console.info(
          '[surea11y] ' +
            field +
            ': no rules for ' +
            levels +
            '; ' +
            (untested.length > 1 ? 'their' : 'its') +
            ' criteria need manual review.'
        );
      } catch {}
    }
  }
}

// The keys the object form of runOnly reads.
const RUN_ONLY_KEYS = ['type', 'values', 'wcag', 'bestPractices', 'tags', 'excludeTags', 'includeRuleIds', 'excludeRuleIds', 'includeTestIds', 'excludeTestIds', 'includeMode', 'optInTags'];

function resolveEffectiveRunOnly(engineOptions, runOnly) {
  const eo = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
  // A number or a boolean, and an object none of whose keys the engine
  // reads ({ includeRuleId: [...] }), used to run every rule, as no runOnly
  // does: a typo that looks like a full scan.
  if (runOnly !== null && runOnly !== undefined && typeof runOnly !== 'string' && typeof runOnly !== 'object') {
    throw invalidRunOnly('runOnly must be an array, a string or an object, not ' + typeof runOnly + '.');
  }
  // A Set of names is the list it holds; as an object it has no keys, which
  // read as no selection and ran every rule.
  if (Object.prototype.toString.call(runOnly) === '[object Set]') runOnly = Array.from(runOnly);
  // Another kind of object (a Map, a Date) has no keys a selection reads,
  // and ran every rule.
  // By its type tag, which holds across realms (a page's object, read by
  // the bundle in another).
  if (runOnly && typeof runOnly === 'object' && !Array.isArray(runOnly)) {
    const kind = Object.prototype.toString.call(runOnly).slice(8, -1);
    if (kind !== 'Object') {
      throw invalidRunOnly('runOnly must be an array, a string or a plain object, not ' + kind + '.');
    }
  }
  if (runOnly && typeof runOnly === 'object' && !Array.isArray(runOnly)) {
    const keys = Object.keys(runOnly);
    const unknownKeys = keys.filter((k) => !RUN_ONLY_KEYS.includes(k));
    if (unknownKeys.length && unknownKeys.length === keys.length) {
      throw invalidRunOnly('runOnly: no key named ' + unknownKeys.map((k) => '"' + k + '"').join(', ') + '; use ' + RUN_ONLY_KEYS.join(', ') + '.');
    }
    // Beside keys it reads, an unknown one is left out, and said so.
    if (unknownKeys.length) {
      try {
        console.warn('[surea11y] runOnly: no key named ' + unknownKeys.map((k) => '"' + k + '"').join(', ') + '; ignored.');
      } catch {}
    }
  }
  // axe-core's { type, values }: 'rule'/'rules' names rules, 'tag'/'tags'
  // tags, as a list or a comma-separated string. Its values are checked like
  // any rule ids or tags, and the other keys beside it (excludeTags,
  // excludeRuleIds...) still apply.
  if (runOnly && typeof runOnly === 'object' && !Array.isArray(runOnly) && runOnly.type !== undefined) {
    const kind = String(runOnly.type).trim().toLowerCase();
    const rest = { ...runOnly };
    delete rest.type;
    delete rest.values;
    if (kind === 'rule' || kind === 'rules') runOnly = { ...rest, includeRuleIds: runOnly.values };
    else if (kind === 'tag' || kind === 'tags') runOnly = { ...rest, tags: runOnly.values };
    else throw invalidRunOnly('runOnly.type must be "rule" or "tag", not ' + JSON.stringify(runOnly.type) + '.');
  }
  runOnly = expandRunOnlyShorthand(runOnly, eo);
  // includeMode is 'and' or 'or'; anything else was read as 'and' without a
  // word, which can select nothing.
  for (const [field, value] of [
    ['runOnly.includeMode', runOnly && typeof runOnly === 'object' && !Array.isArray(runOnly) ? runOnly.includeMode : undefined],
    ['engineOptions.includeMode', eo.includeMode]
  ]) {
    if (value === undefined || value === null) continue;
    const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (mode === 'and' || mode === 'or') continue;
    const message = field + ' must be "and" or "or", not ' + JSON.stringify(value) + '; read as "and".';
    if (strictOf(eo)) throw invalidRunOnly(message);
    try {
      console.warn('[surea11y] ' + message);
    } catch {}
  }
  if (runOnly && typeof runOnly === 'object' && !Array.isArray(runOnly)) {
    if (runOnly.wcag != null) checkWcagTarget(runOnly.wcag);
    if (runOnly.bestPractices !== undefined && typeof runOnly.bestPractices !== 'boolean') {
      throw invalidRunOnly(
        'runOnly.bestPractices must be true or false, not ' + JSON.stringify(runOnly.bestPractices) + '.'
      );
    }
  }
  const requestedProfile = normalizeProfileName(eo.profile);

  if (hasAnyRunOnlyKeys(runOnly)) {
    const selection = normalizeRunOnly(runOnly);
    checkSelectionNames(
      [
        { field: 'runOnly.includeRuleIds', values: selection.includeRuleIds, kind: 'rule', include: true },
        { field: 'runOnly.tags', values: selection.tags, kind: 'tag', include: true },
        { field: 'runOnly.includeTestIds', values: selection.includeTestIds, kind: 'rule', include: true },
        { field: 'runOnly.excludeRuleIds', values: selection.excludeRuleIds, kind: 'rule' },
        { field: 'runOnly.excludeTestIds', values: selection.excludeTestIds, kind: 'rule' },
        { field: 'runOnly.excludeTags', values: selection.excludeTags, kind: 'tag' }
      ],
      eo,
      { otherIncludes: !!(selection.wcag || selection.bestPractices) }
    );
    // Only engineOptions.optInRules unlocks, and only a profile names its own
    // tag; a caller's runOnly does neither.
    selection.optInTags = [];
    selection.ownTags = [];
    return applyOptInRules(applyProfile(selection, requestedProfile), eo.optInRules);
  }

  const mode = normalizeIncludeMode(eo.includeMode);

  // { include, exclude }; a bare list or string is the include list, as
  // runOnly takes one. As an object with neither key it ran every rule.
  const includeExclude = (v) =>
    Array.isArray(v) || typeof v === 'string' || Object.prototype.toString.call(v) === '[object Set]'
      ? { include: Array.from(typeof v === 'string' ? [v] : v) }
      : (v && typeof v === 'object' ? v : null);
  const rules = includeExclude(eo.rules);
  const tags = includeExclude(eo.tags);
  const tests = includeExclude(eo.tests);

  const includeRuleIds = parseCommaList(rules && rules.include, { lower: false });
  const excludeRuleIds = parseCommaList(rules && rules.exclude, { lower: false });

  const includeTags = parseCommaList(tags && tags.include, { lower: true });
  const excludeTags = parseCommaList(tags && tags.exclude, { lower: true });

  const includeTestIds = parseCommaList(tests && tests.include, { lower: false });
  const excludeTestIds = parseCommaList(tests && tests.exclude, { lower: false });

  const out = {
    includeMode: mode,
    tags: includeTags,
    excludeTags,
    includeRuleIds,
    excludeRuleIds,
    includeTestIds,
    excludeTestIds
  };
  checkSelectionNames(
    [
      { field: 'engineOptions.rules.include', values: includeRuleIds, kind: 'rule', include: true },
      { field: 'engineOptions.tags.include', values: includeTags, kind: 'tag', include: true },
      { field: 'engineOptions.tests.include', values: includeTestIds, kind: 'rule', include: true },
      { field: 'engineOptions.rules.exclude', values: excludeRuleIds, kind: 'rule' },
      { field: 'engineOptions.tests.exclude', values: excludeTestIds, kind: 'rule' },
      { field: 'engineOptions.tags.exclude', values: excludeTags, kind: 'tag' }
    ],
    eo
  );

  return applyOptInRules(applyProfile(out, requestedProfile), eo.optInRules);
}

function ruleIdMatches(candidate, ruleId, engineTag) {
  if (!candidate || !ruleId) return false;
  if (candidate === ruleId) return true;

  const prefix = (engineTag ? String(engineTag) : '') + '-';
  if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
  if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

  return false;
}

function buildCompositeRuleIndex() {
  const idx = Object.create(null);
  if (!Array.isArray(COMPOSITE_RULES)) return idx;

  for (const entry of COMPOSITE_RULES) {
    if (!entry || typeof entry !== 'object') continue;
    const id = typeof entry.id === 'string' ? entry.id.trim() : String(entry.id || '').trim();
    if (!id) continue;

    const checksIds = Array.isArray(entry.checksIds)
      ? entry.checksIds.map(String).map((s) => s.trim()).filter(Boolean)
      : [];

    if (checksIds.length) idx[id] = checksIds;
  }

  return idx;
}

const COMPOSITE_RULE_INDEX = buildCompositeRuleIndex();

// The criteria of each WCAG rollup, by id: a custom rule mapped to one of
// them is one of its rules (rollupMembers, #179). A standard's own rollups
// aren't listed.
function buildCompositeWcagScIndex() {
  const idx = Object.create(null);
  if (!Array.isArray(COMPOSITE_RULES)) return idx;
  for (const entry of COMPOSITE_RULES) {
    const id = entry && typeof entry.id === 'string' ? entry.id.trim() : '';
    if (!id || (entry.meta && entry.meta.standard)) continue;
    const sc = entry.meta && Array.isArray(entry.meta.wcagSc) ? entry.meta.wcagSc.map(String) : [];
    if (sc.length) idx[id] = sc;
  }
  return idx;
}

const COMPOSITE_WCAG_SC_INDEX = buildCompositeWcagScIndex();

// The opt-in tags each standard's own rollup carries (its standard's rule
// tag), by rollup id. Naming such a rollup asks for its
// standard, so it unlocks the opt-in rules it groups.
function buildOptInCompositeTags() {
  const out = Object.create(null);
  if (!Array.isArray(COMPOSITE_RULES)) return out;
  for (const entry of COMPOSITE_RULES) {
    const id = entry && typeof entry.id === 'string' ? entry.id.trim() : '';
    const optIn = id ? optInTagsOf({ ruleId: id }) : [];
    if (optIn.length) out[id] = optIn;
  }
  return out;
}

const OPT_IN_COMPOSITE_TAGS = buildOptInCompositeTags();

// A composite id, with or without the engine's legacy "<tag>-" prefix, as an
// atomic rule id may carry it.
function compositeIdOf(candidateId) {
  const id = typeof candidateId === 'string' ? candidateId.trim() : '';
  if (!id) return '';
  if (COMPOSITE_RULE_INDEX[id]) return id;
  const prefix = String(ENGINE_TAG) + '-';
  return id.startsWith(prefix) && COMPOSITE_RULE_INDEX[id.slice(prefix.length)] ? id.slice(prefix.length) : '';
}

function expandCompositeRuleId(candidateId) {
  const id = compositeIdOf(candidateId);
  if (!id) return null;
  const checksIds = COMPOSITE_RULE_INDEX[id];
  return Array.isArray(checksIds) && checksIds.length ? checksIds : null;
}

// Whether def is one of the rules of the rollup a composite id names: on its
// list, or a custom rule mapped to one of its criteria.
function isCompositeMember(candidateId, def) {
  const expanded = expandCompositeRuleId(candidateId);
  if (!expanded) return false;
  if (expanded.includes(def.ruleId)) return true;
  const sc = COMPOSITE_WCAG_SC_INDEX[compositeIdOf(candidateId)];
  return (
    !!def.custom && !!sc && Array.isArray(def.wcagSc) && def.wcagSc.some((x) => sc.includes(x))
  );
}

function ruleMatchesRunOnly(def, runOnly, engineTag) {
  const norm = normalizeRunOnly(runOnly);
  const includeMode = normalizeIncludeMode(norm.includeMode);

  const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];

  const hasRuleInclude = norm.includeRuleIds.length > 0;
  const hasTestInclude = norm.includeTestIds.length > 0;
  const hasTagInclude = norm.tags.length > 0 || norm.ownTags.length > 0;

  // An opt-in rule runs only when asked for: its tag is among the include
  // tags, its id is included directly, a rollup of its own standard that
  // groups it is included by id, or engineOptions.optInRules unlocked its
  // tag. Nothing else selects it, not a default run, a WCAG tag set or a WCAG
  // rollup id, so a scan that does not target the standard never reports a
  // failure only that standard defines.
  const optInTags = optInTagsOf(def);
  if (optInTags.length) {
    const askedByTag = optInTags.some(
      (t) => norm.tags.includes(t) || norm.ownTags.includes(t) || norm.optInTags.includes(t)
    );
    const askedById = norm.includeRuleIds
      .concat(norm.includeTestIds)
      .some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    const askedByRollup = norm.includeRuleIds.some((id) => {
      const rollupTags = OPT_IN_COMPOSITE_TAGS[String(id).trim()];
      const expanded = rollupTags ? expandCompositeRuleId(id) : null;
      return !!expanded && expanded.includes(def.ruleId) && rollupTags.some((t) => optInTags.includes(t));
    });
    if (!askedByTag && !askedById && !askedByRollup) return false;
  }

  let idMatch = true;
  let tagMatch = true;

  if (hasRuleInclude) {
    idMatch = norm.includeRuleIds.some((ruleId) => {
      // 1) Direct match always wins (this allows selecting the composite itself)
      if (ruleIdMatches(ruleId, def.ruleId, engineTag || ENGINE_TAG)) return true;
      
      // 2) If candidate is a composite id, include atomic children as well
      if (expandCompositeRuleId(ruleId)) return isCompositeMember(ruleId, def);
      
      return false;
    });
  }

  if (hasTestInclude) {
    const testMatch = norm.includeTestIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    idMatch = hasRuleInclude ? (idMatch && testMatch) : testMatch;
  }

  if (hasTagInclude) {
    // A profile's own tag matches only the rules and rollups its standard
    // brings.
    tagMatch =
      defTags.some((t) => norm.tags.includes(t)) ||
      optInTags.some((t) => norm.ownTags.includes(t));
  }

  // Includes
  const hasAnyIdInclude = hasRuleInclude || hasTestInclude;

  let included = true;
  if (hasAnyIdInclude || hasTagInclude) {
    if (includeMode === 'or' && hasAnyIdInclude && hasTagInclude) {
      included = idMatch || tagMatch;
    } else {
      // 'and' semantics (or only one include dimension present)
      included = (!hasAnyIdInclude || idMatch) && (!hasTagInclude || tagMatch);
    }
  }

  // A WCAG target (runOnly.wcag) adds the rules for its criteria to what the
  // ids and tags include, and runOnly.bestPractices the best-practice rules:
  // the union of them all. A rule naming no criterion is not part of a
  // target; the best-practice rules are those.
  if (norm.wcag || norm.bestPractices) {
    const inTarget =
      !!norm.wcag && wcagCriteriaOfDef(def).some((sc) => criterionInWcagTarget(sc, norm.wcag));
    const isBestPractice = norm.bestPractices && defTags.includes(BEST_PRACTICE_TAG);
    included = inTarget || isBestPractice || ((hasAnyIdInclude || hasTagInclude) && included);
  }
  if (!included) return false;

  // Excludes (always subtractive; apply after include)
  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((ruleId) => {
      // 1) Direct match excludes the composite itself (and any atomic with same id)
      if (ruleIdMatches(ruleId, def.ruleId, engineTag || ENGINE_TAG)) return true;
  
      // 2) If candidate is a composite id, exclude its atomic children too
      if (expandCompositeRuleId(ruleId)) return isCompositeMember(ruleId, def);
  
      return false;
    });
    if (blocked) return false;
  }

  if (norm.excludeTestIds.length) {
    const blocked = norm.excludeTestIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    if (blocked) return false;
  }

  if (norm.excludeTags.length) {
    const blockedTag = defTags.some((t) => norm.excludeTags.includes(t));
    if (blockedTag) return false;
  }

  return true;
}

function normalizeRuleResult(def, raw, schemaVersion, policy, helpers) {
  if (!policy || typeof policy !== 'object') {
    throw new Error('normalizeRuleResult requires a resolved policy');
  }
  const pol = policy;
  const out = raw && typeof raw === 'object' ? { ...raw } : {};
  out.ruleId = def.ruleId;
  
  // NOTE: title and description are included here (already localized)
  // so consumers do not need to rejoin with the rule catalog.
  out.title = def.title;
  out.description = def.description;
  out.i18n = def.i18n || null;

  if (!pol.allowedOutcomes.includes(out.outcome)) {
    if (['fail', 'pass', 'cantTell', 'notApplicable'].includes(out.outcome)) {
      // An outcome the policy doesn't allow: the rule completed, and a person
      // is asked instead. policyOutcome keeps what the rule found.
      out.policyOutcome = out.outcome;
    } else {
      // Say why, so a custom rule returning 'failed' or 'inapplicable' finds
      // out instead of reading an unexplained cantTell.
      const given = out.outcome === undefined ? 'no outcome' : 'outcome ' + JSON.stringify(out.outcome);
      out.error = (out.error ? String(out.error) + ' | ' : '') + 'The rule returned ' + given + ', which is not one of ' + pol.allowedOutcomes.join(', ') + '; reported as cantTell.';
    }
    out.outcome = 'cantTell';
  }

  // The outcome agrees with its occurrences' tiers, which are the more
  // specific: a fail-tier occurrence makes it fail, and a fail whose
  // occurrences are all cantTell-tier is cantTell. The reporters read
  // different layers (SARIF and JUnit the tiers, EARL and baselines the
  // outcome), so a rule returning them at odds was a failure to one and not
  // to another. Core's rules never return them at odds; a custom or pack
  // rule can. An occurrence with no tier takes the outcome's.
  {
    const tiers = Array.isArray(out.occurrences)
      ? out.occurrences.map((o) => (o && typeof o === 'object' ? o.occurrenceOutcome : undefined))
      : [];
    if ((out.outcome === 'cantTell' || out.outcome === 'pass') && tiers.includes('fail')) {
      out.outcome = 'fail';
    } else if (out.outcome === 'fail' && tiers.length && tiers.every((x) => x === 'cantTell')) {
      out.outcome = 'cantTell';
    }
  }

  out.outcomeNormalized =
    out.outcome === 'notApplicable' ? 'inapplicable' : out.outcome;
    
    const output = (out.engineOptions && out.engineOptions.output && typeof out.engineOptions.output === 'object')
    ? out.engineOptions.output
    : null;

  const includeSelector = !(output && switchOf(output.includeSelector) === false);
  const includeHtml = !(output && switchOf(output.includeHtml) === false);

  const needsDetails = (out.outcome === 'fail' || out.outcome === 'cantTell');

  // Manual rules must never "fail" automatically
  if (pol.coerceManualFailToCantTell && def.type === 'manual' && out.outcome === 'fail') {
    out.outcome = 'cantTell';
    out.outcomeNormalized = 'cantTell';
    // Its fail-tier occurrences go with it, or the reporters that read tiers
    // would still count a failure.
    if (Array.isArray(out.occurrences)) {
      out.occurrences = out.occurrences.map((o) =>
        o && typeof o === 'object' && o.occurrenceOutcome === 'fail' ? { ...o, occurrenceOutcome: 'cantTell' } : o
      );
    }
    out.error = (out.error ? String(out.error) + ' | ' : '') + 'Manual rules cannot return outcome=fail; coerced to cantTell.';
  }

  // A severity outside the documented set falls back to the rule's own.
  if (out.severity && !['minor', 'moderate', 'serious', 'critical'].includes(out.severity)) {
    out.error = (out.error ? String(out.error) + ' | ' : '') + 'The rule returned severity ' + JSON.stringify(out.severity) + ', which is not one of minor, moderate, serious, critical; reported with its default severity.';
    out.severity = def.defaultSeverity;
  }
  out.severity = out.severity || def.defaultSeverity;

  let conf = raw && raw.confidence;
  if (!pol.allowedConfidence.includes(conf)) conf = def.defaultConfidence;
  out.confidence = conf;

  out.type = def.type;

  // Standards-only metadata passthrough for traceability
  out.meta = {
    ruleId: def.ruleId,
    ruleInterfaceVersion: def.ruleInterfaceVersion,
    ruleVersion: def.ruleVersion,
    normative: def.normative,
    atomic: def.atomic,
    deprecated: !!def.deprecated,
    deprecation: def.deprecation || null,
    category: def.category || null,
    // Where to read how to fix it, and the rule's tags (its own and the
    // engine's): reporters show both, a custom rule's included.
    helpUrl: typeof def.helpUrl === 'string' ? def.helpUrl : '',
    tags: Array.isArray(def.tags) ? def.tags.slice() : [],
    normativeMappings: Array.isArray(def.normativeMappings) ? def.normativeMappings.map((o) => ({ ...o })) : [],
    standard: def.standard || null,
    applicability: def.applicability || '',
    expectation: def.expectation || '',
    references: Array.isArray(def.references) ? def.references.slice() : [],
    requirements: def.requirements || null,
    mappings: def.mappings || null
  };

  out.schemaVersion = schemaVersion;

  // A rule that declares meta.margin hands over the elements that met its
  // threshold; the closest becomes the result's margin (src/core/margin.js).
  // Whatever a rule put in these fields itself, only the resolved one stays.
  const resolvedMargin = def.margin
    ? resolveMargin(def.margin, out.marginCandidates, out.measuredCount, helpers, { includeSelector })
    : null;
  delete out.marginCandidates;
  delete out.measuredCount;
  if (resolvedMargin) out.margin = resolvedMargin;
  else delete out.margin;

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  let __truncatedOccurrences = 0;
  // Uncertainty codes outside the closed set, dropped and noted in error.
  const __invalidUncertaintyCodes = [];
  let __placedOccurrences = 0;
  out.occurrences = occ.map((item) => {
    const o = item && typeof item === 'object' ? { ...item } : {};

    // Engine-side finalization (only if rule reported a node)
    const node = o.__node || null;
    if (node) delete o.__node;

    // A 200-step ancestor walk that stopped short cannot show the element is
    // exposed, so a fail resting only on such elements is not certain enough.
    if (node && helpers && typeof helpers.hasTruncatedAncestorWalk === 'function') {
      try {
        if (helpers.hasTruncatedAncestorWalk(node)) __truncatedOccurrences += 1;
      } catch {}
      __placedOccurrences += 1;
    }

    if (needsDetails && node && helpers && typeof helpers === 'object') {
      if (includeSelector && (!o.selector || typeof o.selector !== 'string')) {
        try {
          o.selector = (typeof helpers.buildSelector === 'function') ? String(helpers.buildSelector(node) || '') : '';
        } catch {
          o.selector = '';
        }
      }
      if (includeHtml && (!o.html || typeof o.html !== 'string')) {
        try {
          o.html = (typeof helpers.getOuterHtmlSnippet === 'function') ? String(helpers.getOuterHtmlSnippet(node) || '') : '';
        } catch {
          o.html = '';
        }
      }
      // An element in a shadow tree: its selector holds inside its shadow
      // root, and these lead there from the document.
      if (includeSelector && typeof helpers.buildShadowHostSelectors === 'function') {
        try {
          const hostSelectors = helpers.buildShadowHostSelectors(node);
          if (hostSelectors) o.shadowHostSelectors = hostSelectors;
        } catch {}
      }
    }

    // A more robust element-identity mechanism than the CSS selector string
    // alone (see dom-helpers.js's buildStructuralPath for the full
    // rationale) -- computed centrally here, for every occurrence, rather
    // than requiring each of the ~124 rules to compute it themselves.
    // Prefers the actual element reference (node, when the rule reported
    // one); falls back to re-resolving via the occurrence's own selector
    // otherwise, same as buildStructuralPath already does internally.
    if (needsDetails && helpers && typeof helpers.buildStructuralPath === 'function') {
      try {
        o.structuralPath = helpers.buildStructuralPath(node, o.selector);
      } catch {
        o.structuralPath = null;
      }
    } else {
      o.structuralPath = null;
    }

    // Enforce string types (deterministic / no-throw)
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.hint !== 'string') o.hint = '';
    if (typeof o.html !== 'string') o.html = '';

    // Uncertainty describes a cantTell-tier finding; on a fail-tier occurrence
    // it would claim the rule both decided and did not, so it is dropped.
    const occTier =
      (o.occurrenceOutcome === 'fail' || o.occurrenceOutcome === 'cantTell')
        ? o.occurrenceOutcome
        : out.outcome;
    const normalizedUncertainty =
      occTier === 'cantTell' ? normalizeUncertainty(o.uncertainty) : null;
    if (normalizedUncertainty) o.uncertainty = normalizedUncertainty;
    else {
      if (occTier === 'cantTell' && o.uncertainty && typeof o.uncertainty === 'object') {
        const code = JSON.stringify(o.uncertainty.code === undefined ? null : o.uncertainty.code);
        if (!__invalidUncertaintyCodes.includes(code)) __invalidUncertaintyCodes.push(code);
      }
      delete o.uncertainty;
    }

    // Existing i18n normalization/resolution (leave as-is, shown shortened here)
    if (o.i18n && typeof o.i18n === 'object' && !Array.isArray(o.i18n)) {
      const ii = { ...o.i18n };
      if (typeof ii.summaryKey !== 'string') ii.summaryKey = '';
      if (typeof ii.hintKey !== 'string') ii.hintKey = '';
      if (ii.params && typeof ii.params === 'object' && !Array.isArray(ii.params)) {
        ii.params = { ...ii.params };
      } else {
        ii.params = {};
      }
      o.i18n = ii;

      if (ii.summaryKey) o.summary = t(ii.summaryKey, o.summary, ii.params, out.engineOptions || null);
      if (ii.hintKey) o.hint = t(ii.hintKey, o.hint, ii.params, out.engineOptions || null);
    } else {
      o.i18n = null;
    }

    return o;
  });

  // Downgrade only when every reported element was out of reach of its own
  // walk. One element the engine could see through justifies the fail; the
  // rest ride along as occurrences of it, same as any mixed-confidence result.
  if (
    out.outcome === 'fail' &&
    __placedOccurrences > 0 &&
    __truncatedOccurrences === __placedOccurrences
  ) {
    out.outcome = 'cantTell';
    out.outcomeNormalized = 'cantTell';
    out.error =
      (out.error ? String(out.error) + ' | ' : '') +
      'Ancestor walk hit its depth limit, so the engine could not confirm this content is exposed; coerced to cantTell.';
  }

  if (__invalidUncertaintyCodes.length) {
    out.error =
      (out.error ? String(out.error) + ' | ' : '') +
      'The rule returned uncertainty code ' + __invalidUncertaintyCodes.join(', ') +
      ', which is not one of ' + UNCERTAINTY_CODE_VALUES.join(', ') + '; the uncertainty was left out.';
  }

  // The rule's own error comes first, then each note the engine added:
  // neither replaces the other.
  if (out.error != null && typeof out.error !== 'string') out.error = String(out.error);

  return out;
}

// The standards a catalog entry names for these options, chosen exactly as for
// a scan result: engineOptions.mappings, plus what a profile adds when it
// would apply to this selection. With no options that is WCAG alone.
function catalogMappingTokens(engineOptions, runOnly) {
  const selection = resolveEffectiveRunOnly(engineOptions, runOnly);
  return resolveMappingSelection(engineOptions, selection.profile || null).tokens;
}

function toCatalogEntry(r, engineOptions, mappingTokens) {
  const tokens = Array.isArray(mappingTokens) ? mappingTokens : catalogMappingTokens(engineOptions, null);
  return {
    ruleId: r.ruleId,
    title: (r && r.i18n ? t(r.i18n.titleKey, r.title, null, engineOptions) : r.title),
    description: (r && r.i18n ? t(r.i18n.descriptionKey, r.description, null, engineOptions) : r.description),
    i18n: r.i18n || null,
    helpUrl: r.helpUrl,
    tags: Array.isArray(r.tags) ? r.tags.slice() : [],
    wcagSc: Array.isArray(r.wcagSc) ? r.wcagSc.slice() : [],
    normativeMappings: Array.isArray(r.normativeMappings)
      ? filterNormativeMappings(r.normativeMappings, tokens).map((o) => ({ ...o }))
      : [],
    defaultSeverity: r.defaultSeverity,
    defaultConfidence: r.defaultConfidence,
    type: r.type,
    coverage: r.coverage || null,

    data: (r.data === undefined ? null : r.data),

    ruleInterfaceVersion: r.ruleInterfaceVersion,
    ruleVersion: r.ruleVersion,
    normative: r.normative,
    atomic: r.atomic,
    deprecated: !!r.deprecated,
    deprecation: r.deprecation || null,
    category: r.category || null,
    standard: r.standard || null,
    applicability: r.applicability || '',
    expectation: r.expectation || '',
    references: Array.isArray(r.references) ? r.references.slice() : [],
    requirements: r.requirements || null,
    mappings: r.mappings || null,
    margin: r.margin ? { ...r.margin } : null
  };
}

// Inlined from src/core/safe-dom.js -- DOM reads a page's named form
// controls and images can't redirect.
const SAFE_DOM_GETTERS = ${jsStringify(SAFE_DOM_GETTERS)};
const SAFE_DOM_METHODS = ${jsStringify(SAFE_DOM_METHODS)};
const SAFE_DOM_OTHER_NAMES = ${jsStringify(SAFE_DOM_OTHER_NAMES)};
${inlineConstFunction('createSafeDom', createSafeDom)}

// Inlined from src/core/contrast-helpers.js
${inlineConstFunction('createContrastHelpers', createContrastHelpers)}

// Inlined from src/core/aria-helpers.js
${inlineConstFunction('createAriaHelpers', createAriaHelpers)}

// Inlined from src/core/dom-helpers.js
${inlineConstFunction('normalizeSelectorList', normalizeSelectorList)}
${inlineConstFunction('describeOptionValue', describeOptionValue)}
${inlineConstFunction('engineOptionSpec', engineOptionSpec)}
${inlineConstFunction('checkEngineOptions', checkEngineOptions)}
${inlineConstFunction('enforceEngineOptions', enforceEngineOptions)}
${inlineConstFunction('strictOf', strictOf)}
${inlineConstFunction('switchOf', switchOf)}
${inlineConstFunction('resolveContextRoots', resolveContextRoots)}
${inlineConstFunction('createDomHelpers', createDomHelpers)}

// Inlined from src/core/uncertainty.js -- the cantTell vocabulary, emitted so
// normalizeRuleResult can validate an occurrence's uncertainty in-page.
const UNCERTAINTY_CODE_VALUES = ${jsStringify(UNCERTAINTY_CODE_VALUES)};
${inlineConstFunction('isUncertaintyCode', isUncertaintyCode)}
${inlineConstFunction('normalizeUncertainty', normalizeUncertainty)}

// Inlined from src/core/margin.js -- normalizeRuleResult turns a rule's
// margin candidates into the result's margin in-page.
${inlineConstFunction('resolveMargin', resolveMargin)}

// Inlined from src/core/rule-meta.js (also used at build time by loadRuleModules
// above -- single source of truth -- and here so runtime-registered custom
// rules via engineOptions.customRules get identical meta defaulting/validation
// to build-time rules; see runCore's own customRules handling)
${inlineConstFunction('normalizeRuleMeta', normalizeRuleMeta)}

// Inlined from src/core/dom-runner.js
${inlineConstFunction('rollupMembers', rollupMembers)}
${inlineConstFunction('rollupCompositeResults', rollupCompositeResults)}

${inlineConstFunction('readRenderingEnvironment', readRenderingEnvironment)}

${inlineConstFunction('settleAnimations', settleAnimations)}
${inlineConstFunction('resolveCustomRules', resolveCustomRules)}
${inlineConstFunction('runCoreSettled', runCoreSettled)}
${inlineConstFunction('isThenable', isThenable)}
${inlineConstFunction('assertPageBuiltins', assertPageBuiltins)}
${inlineConstFunction('runCore', runCore)}

// Inlined from src/core/frame-messaging.js -- postMessage RPC used by
// runa11yCoreAcrossFrames/a11yCoreEnableFrameResponder below (browser-only
// cross-frame scanning for the "plain script injection" consumption mode).
const FRAME_RPC_CHANNEL = ${jsStringify(FRAME_RPC_CHANNEL)};
${inlineConstFunction('getFrameRpcRegistry', getFrameRpcRegistry)}
${inlineConstFunction('installFrameRpcListener', installFrameRpcListener)}
${inlineConstFunction('nextFrameRpcRequestId', nextFrameRpcRequestId)}
${inlineConstFunction('pingFrame', pingFrame)}
${inlineConstFunction('sendFrameRunCommand', sendFrameRunCommand)}
${inlineConstFunction('enableFrameRpcResponder', enableFrameRpcResponder)}
`.trim();

  const inPageRunnerSource = `
function runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  // Before anything reads the page's built-ins (see assertPageBuiltins).
  ${inlineConstFunction('assertPageBuiltinsFirst', assertPageBuiltins)}
  assertPageBuiltinsFirst();
  const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
  const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};
  const ENGINE_VERSION = ${jsStringify(ENGINE_VERSION)};

  // The catalog built in: the rules (data only), their code, the rollups, and
  // the rest of the data the shared runtime below reads.
  const BUILT_IN_CATALOG = {
    checkDefs: ${jsStringify(defs)},
    composites: ${jsStringify(COMPOSITE_RULES)},
    impls: {
${implEntriesInPage.join(',\n')}
    },
    ...${jsStringify(data)}
  };

  // Packs prepared in Node and registered in this page by their script
  // (packScript in src/pack.js), named in engineOptions.packs as
  // name@version: the scan runs on the catalog they were prepared with. A
  // pack rule's code is the pack's; a rule it doesn't change keeps the code
  // built in, and core's dictionaries get the packs' messages added.
  function packCatalog(builtIn, entry) {
    const impls = {};
    for (const id of Object.keys(entry.impls)) {
      const impl = entry.impls[id];
      impls[id] = typeof impl === 'string' ? builtIn.impls[impl] : impl;
    }
    const i18n = {};
    for (const locale of Object.keys(builtIn.i18n)) i18n[locale] = Object.assign({}, builtIn.i18n[locale]);
    for (const locale of Object.keys(entry.i18n || {})) {
      i18n[locale] = Object.assign(i18n[locale] || {}, entry.i18n[locale]);
    }
    return Object.assign({}, entry, { impls, i18n });
  }
  const packNames =
    engineOptions &&
    Array.isArray(engineOptions.packs) &&
    engineOptions.packs.length &&
    engineOptions.packs.every((p) => typeof p === 'string')
      ? engineOptions.packs.slice().sort()
      : null;
  const packRegistry = typeof globalThis !== 'undefined' ? globalThis.__surea11yPacks : null;
  // The registered packs run only as one packScript call registered them,
  // with the core they were prepared with: their catalog is core's with
  // those packs, checked against each other in Node, and can't be combined
  // or split here. Packs named otherwise are not run, and the result lists
  // them in skippedPacks with the reason, as a scan in Node does.
  let PACK_ENTRY = null;
  let packProblem = '';
  if (packNames) {
    const registry = packRegistry && typeof packRegistry === 'object' ? packRegistry : null;
    const key = packNames.join(',');
    // Its own key only: "__proto__" or "toString" names no registered set.
    const entry =
      registry && Object.prototype.hasOwnProperty.call(registry, key) && registry[key]
        ? registry[key]
        : null;
    if (!entry) {
      const sets = registry ? Object.keys(registry) : [];
      packProblem =
        'no packScript in this page registered exactly these packs (' +
        (sets.length
          ? 'registered: ' + sets.map((k) => '[' + k.split(',').join(', ') + ']').join(', ')
          : 'none is registered') +
        '); name the packs of one packScript call, or prepare all of them in one';
    } else if (entry.core !== ENGINE_VERSION) {
      packProblem =
        'their script was prepared for core ' +
        (typeof entry.core === 'string' ? entry.core : 'of another version') +
        ', and this page runs core ' +
        ENGINE_VERSION +
        '; prepare it with the core the page runs';
    } else {
      const missing = Object.keys(entry.impls || {}).filter(
        (id) =>
          typeof entry.impls[id] === 'string' &&
          !Object.prototype.hasOwnProperty.call(BUILT_IN_CATALOG.impls, entry.impls[id])
      );
      if (missing.length) {
        packProblem =
          "their script uses core rules this page's core does not have: " + missing.join(', ');
      } else PACK_ENTRY = entry;
    }
  }

  const CATALOG = PACK_ENTRY ? packCatalog(BUILT_IN_CATALOG, PACK_ENTRY) : BUILT_IN_CATALOG;

  // Rule catalog (data only)
  const CHECK_DEFS = CATALOG.checkDefs;

  // Tests catalog (alias of CHECK_DEFS; tests are the atomic executable units)
  const TEST_DEFS = CHECK_DEFS;

  // Composite rules catalog (data only)
  const COMPOSITE_RULES = CATALOG.composites;

  const RULE_IMPLS = CATALOG.impls;

  ${runnersSharedSource}

  // Under strictOptions the options are checked before the selection is
  // worked out from them, as they are said to be.
  if (strictOf(engineOptions)) enforceEngineOptions(engineOptions);
  // Packs given as something other than a list run no pack, and say so;
  // under strictOptions the option check throws.
  if (
    engineOptions &&
    typeof engineOptions === 'object' &&
    engineOptions.packs !== undefined &&
    !Array.isArray(engineOptions.packs) &&
    !strictOf(engineOptions)
  ) {
    try {
      console.warn(
        '[surea11y] engineOptions.packs must be a list of pack names (name@version), and is ' +
          (engineOptions.packs === null ? 'null' : typeof engineOptions.packs) +
          '; it runs without packs.'
      );
    } catch {}
  }
  if (packProblem) {
    const named = engineOptions.packs.filter((n, i) => engineOptions.packs.indexOf(n) === i);
    const message = 'engineOptions.packs: ' + named.join(', ') + ' not run: ' + packProblem;
    if (strictOf(engineOptions)) {
      const err = new Error(message + '. (strictOptions)');
      err.code = 'INVALID_ENGINE_OPTIONS';
      throw err;
    }
    try {
      console.warn('[surea11y] ' + message + '.');
    } catch {}
    const withoutPacks = Object.assign({}, engineOptions);
    delete withoutPacks.packs;
    const unrun = runCore(
      pageUrl,
      contextSelector,
      withoutPacks,
      resolveEffectiveRunOnly(withoutPacks, runOnly),
      CHECK_DEFS,
      RULE_IMPLS,
      ENGINE_TAG,
      SCHEMA_VERSION,
      COMPOSITE_RULES
    );
    const note = (r) =>
      r && typeof r === 'object'
        ? Object.assign({}, r, {
            skippedPacks: named.map((name) => ({ name: name, reason: packProblem }))
          })
        : r;
    return isThenable(unrun) ? unrun.then(note) : note(unrun);
  }
  if (!PACK_ENTRY) {
    return runCore(
      pageUrl,
      contextSelector,
      engineOptions,
      resolveEffectiveRunOnly(engineOptions, runOnly),
      CHECK_DEFS,
      RULE_IMPLS,
      ENGINE_TAG,
      SCHEMA_VERSION,
      COMPOSITE_RULES
    );
  }
  // A scan with registered packs: the options without them, and a result
  // that names them and lists the core rules they replace.
  const scanOptions = Object.assign({}, engineOptions);
  delete scanOptions.packs;
  const result = runCore(
    pageUrl,
    contextSelector,
    scanOptions,
    resolveEffectiveRunOnly(scanOptions, runOnly),
    CHECK_DEFS,
    RULE_IMPLS,
    ENGINE_TAG,
    SCHEMA_VERSION,
    COMPOSITE_RULES
  );
  const stamp = (r) => {
    if (!r || typeof r !== 'object') return r;
    const out = Object.assign({}, r, {
      engine: Object.assign({}, r.engine, { packs: PACK_ENTRY.packs.slice() })
    });
    if (PACK_ENTRY.overrides.length) {
      const ids = (r.overriddenBuiltinIds || []).concat(PACK_ENTRY.overrides);
      out.overriddenBuiltinIds = ids.filter((id, i) => ids.indexOf(id) === i).sort();
    }
    return out;
  };
  return isThenable(result) ? result.then(stamp) : stamp(result);
}
`.trim();

  // Cross-frame scanning for the "plain script injection" consumption mode
  // (surea11y loaded directly into a page with no automation driver -- see
  // docs/INTEGRATION.md's "Browser extension context" section). Browser-only;
  // not needed for a Playwright-driven scan, which reaches cross-origin
  // frames unconditionally via CDP already (see @surea11y/playwright's
  // ROADMAP.md gap #1) -- strictly better than what this cooperative
  // postMessage protocol can achieve, which requires the child frame to
  // also call a11yCoreEnableFrameResponder().
  //
  // Wrapped in its own private IIFE carrying only the postMessage helpers it
  // needs. The local frame is scanned through runa11yCoreInPage, emitted
  // above, which is self-contained and require-free -- so this stays usable
  // the same bundler-free way that function is (raw source injected into a
  // page -- a bookmarklet, a content script with no build step -- rather
  // than requiring a real bundler to resolve require() calls first), without
  // a second copy of the rule catalog and the shared runner block, which
  // together are about half of the generated file.
  //
  // The IIFE assigns onto `window` directly (not just returning a value to
  // a const) so these two functions remain callable from a LATER, SEPARATE
  // script evaluation in the same page -- a real, common browser-extension
  // pattern ("inject once at page load via a content script, invoke later
  // on demand via chrome.scripting.executeScript"). Verified empirically:
  // top-level const/let bindings from an earlier <script>/eval do not
  // reliably survive into a later, separately-evaluated script in the same
  // page (a known V8 Inspector/DevTools-protocol quirk around per-evaluate
  // declarative environments), but explicit assignment onto the global
  // object does, exactly like a plain top-level function declaration
  // already does for runa11yCoreInPage/runDomRulesInPage.
  const crossFrameRunnerSource = `
const __a11yCoreCrossFrameApi = (function () {
  const FRAME_RPC_CHANNEL = ${jsStringify(FRAME_RPC_CHANNEL)};
  const SAFE_DOM_GETTERS = ${jsStringify(SAFE_DOM_GETTERS)};
  const SAFE_DOM_METHODS = ${jsStringify(SAFE_DOM_METHODS)};
const SAFE_DOM_OTHER_NAMES = ${jsStringify(SAFE_DOM_OTHER_NAMES)};
${inlineConstFunction('createSafeDom', createSafeDom)}
${inlineConstFunction('getFrameRpcRegistry', getFrameRpcRegistry)}
${inlineConstFunction('installFrameRpcListener', installFrameRpcListener)}
${inlineConstFunction('nextFrameRpcRequestId', nextFrameRpcRequestId)}
${inlineConstFunction('pingFrame', pingFrame)}
${inlineConstFunction('sendFrameRunCommand', sendFrameRunCommand)}
${inlineConstFunction('enableFrameRpcResponder', enableFrameRpcResponder)}
${inlineConstFunction('normalizeSelectorList', normalizeSelectorList)}
${inlineConstFunction('describeOptionValue', describeOptionValue)}
${inlineConstFunction('resolveContextRoots', resolveContextRoots)}

${findChildFrameElements.toString()}

${engineOptionsForFrames.toString()}

${isFrameShown.toString()}

${isFrameExcluded.toString()}

${getFrameElementSelector.toString()}

${describeFrameElement.toString()}

${getFrameElementUrl.toString()}

${runa11yCoreAcrossFrames.toString()}

${a11yCoreEnableFrameResponder.toString()}

  if (typeof window !== 'undefined') {
    window.runa11yCoreAcrossFrames = runa11yCoreAcrossFrames;
    window.a11yCoreEnableFrameResponder = a11yCoreEnableFrameResponder;
  }

  return { runa11yCoreAcrossFrames: runa11yCoreAcrossFrames, a11yCoreEnableFrameResponder: a11yCoreEnableFrameResponder };
})();
const runa11yCoreAcrossFrames = __a11yCoreCrossFrameApi.runa11yCoreAcrossFrames;
const a11yCoreEnableFrameResponder = __a11yCoreCrossFrameApi.a11yCoreEnableFrameResponder;

// Waits for the page to load before a scan; the scan itself never calls it
// (src/core/page-ready.js).
${waitForPageReady.toString()}

// Every margin in a scan result, for tools that read them (src/core/margin.js).
${getMargins.toString()}
`.trim();

  return `'use strict';

const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};
const ENGINE_VERSION = ${jsStringify(ENGINE_VERSION)};

/**
 * The engine over one catalog: its rules (checkDefs), their code (impls),
 * its rollups (composites), and the rest of its data (dictionaries, the
 * standards and their profiles; see catalogData in src/core/prepare-catalog.js).
 * The package's engine is the one over the catalog built in below; a catalog
 * prepared with more rules and standards (src/core/prepare-catalog.js) gets
 * an engine of its own the same way.
 */
function createRuntime(CATALOG) {
// Rule catalog (data only)
const CHECK_DEFS = CATALOG.checkDefs;

// Tests catalog (alias of CHECK_DEFS; tests are the atomic executable units)
const TEST_DEFS = CHECK_DEFS;

// Composite rules catalog (data only)
const COMPOSITE_RULES = CATALOG.composites;

// Rule implementations, by rule id: { run, applicability }
const RULE_IMPLS = CATALOG.impls;

${runnersSharedSource}

// The rules a scan with these engineOptions has: the built-in ones, with
// the valid engineOptions.customRules added and the ones they override
// replaced, checked by the scan's own resolveCustomRules.
function catalogCheckDefs(engineOptions) {
  const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  const custom = resolveCustomRules(eo.customRules, CHECK_DEFS, COMPOSITE_RULES, ENGINE_TAG);
  if (!custom.defs.size) return { defs: CHECK_DEFS, overridden: [] };
  return {
    defs: CHECK_DEFS.filter((d) => !custom.defs.has(d.ruleId)).concat(Array.from(custom.defs.values())),
    overridden: custom.overriddenBuiltinIds
  };
}

function getCheckDefById(ruleId, engineOptions) {
  const r = catalogCheckDefs(engineOptions).defs.find((x) => x.ruleId === ruleId) || null;
  return r ? toCatalogEntry(r, engineOptions) : null;
}

function getChecksCatalog(engineOptions) {
  // Tests are the atomic executable units (currently stored in CHECK_DEFS).
  // We return the same catalog entries shape as rules for now.
  const tokens = catalogMappingTokens(engineOptions, null);
  return catalogCheckDefs(engineOptions).defs.map((r) => toCatalogEntry(r, engineOptions, tokens));
}

// A composite's catalog entry, with the other-standard entries of its rules
// filtered the same way as a rule's.
function toCompositeCatalogEntry(x, tokens, customDefs) {
  const meta = x.meta && typeof x.meta === 'object'
    ? {
        ...x.meta,
        standardMappings: Array.isArray(x.meta.standardMappings)
          ? filterNormativeMappings(x.meta.standardMappings, tokens).map((o) => ({ ...o }))
          : []
      }
    : x.meta;
  // A WCAG rollup's rules include the custom rules mapped to its criteria.
  const members =
    x.meta && x.meta.standard
      ? null
      : rollupMembers(x.checksIds, x.meta && x.meta.wcagSc, customDefs);
  return {
    ...x,
    checksIds: members ? members.ids : Array.isArray(x.checksIds) ? x.checksIds.slice() : [],
    ...(members && members.customIds.length ? { customChecksIds: members.customIds } : {}),
    meta
  };
}

// The custom rules a scan with these options has, for the rollups' lists.
function catalogCustomDefs(engineOptions) {
  const eo = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  return resolveCustomRules(eo.customRules, CHECK_DEFS, COMPOSITE_RULES, ENGINE_TAG).defs;
}

// A standard's own rollup is opt-in like that standard's rules: listed only
// when the selection names its tag (as the standard's profile does) or its
// id, or unlocks its tag through engineOptions.optInRules and includes
// nothing else, so the catalog lists what a scan with the same options would
// produce.
function isCompositeListed(x, selection) {
  // An excluded rollup, by the caller or by a profile's exclude, is not
  // produced, so it is not listed.
  if ((selection.excludeRuleIds || []).some((id) => ruleIdMatches(id, x.id, ENGINE_TAG))) return false;
  const optIn = optInTagsOf({ ruleId: x.id });
  if (!optIn.length) return true;
  if (!rollupInProfileVersion(x.meta.standard, x.meta.version, selection)) return false;
  // Unlocked alone does not select it: like the run, an include of other
  // tags or ids (a WCAG profile's, say) still leaves it out.
  const includesNothing =
    !selection.wcag &&
    !selection.bestPractices &&
    !selection.tags.length &&
    !(selection.ownTags || []).length &&
    !selection.includeRuleIds.length &&
    !selection.includeTestIds.length;
  const unlocked = includesNothing && optIn.some((t) => (selection.optInTags || []).includes(t));
  return (
    unlocked ||
    optIn.some((t) => selection.tags.includes(t) || (selection.ownTags || []).includes(t)) ||
    selection.includeRuleIds.some((id) => ruleIdMatches(id, x.id, ENGINE_TAG))
  );
}

function getRulesCatalog(engineOptions) {
  // Data-only catalog. No i18n resolution yet (we can add later if needed).
  const tokens = catalogMappingTokens(engineOptions, null);
  const selection = resolveEffectiveRunOnly(engineOptions, null);
  const customDefs = catalogCustomDefs(engineOptions);
  return Array.isArray(COMPOSITE_RULES)
    ? COMPOSITE_RULES.filter((x) => isCompositeListed(x, selection)).map((x) =>
        toCompositeCatalogEntry(x, tokens, customDefs)
      )
    : [];
}

function getCompositeRuleById(ruleId, engineOptions) {
  if (!Array.isArray(COMPOSITE_RULES)) return null;
  const found = COMPOSITE_RULES.find((x) => x && typeof x === 'object' && x.id === ruleId) || null;
  if (!found) return null;
  return toCompositeCatalogEntry(
    found,
    catalogMappingTokens(engineOptions, null),
    catalogCustomDefs(engineOptions)
  );
}

function getChecksForRunOnly(runOnly, engineOptions) {
  const selection = resolveEffectiveRunOnly(engineOptions, runOnly);
  const tokens = catalogMappingTokens(engineOptions, runOnly);
  const { defs, overridden } = catalogCheckDefs(engineOptions);
  // As in a scan, an override is selected wherever its built-in would be.
  const selected = (r) =>
    ruleMatchesRunOnly(r, selection, ENGINE_TAG) ||
    (overridden.includes(r.ruleId) &&
      CHECK_DEFS.some((d) => d.ruleId === r.ruleId && ruleMatchesRunOnly(d, selection, ENGINE_TAG)));
  return defs.filter(selected).map((r) => toCatalogEntry(r, engineOptions, tokens));
}

function getTestsForRunOnly(runOnly, engineOptions) {
  // Tests are the atomic executable units; selection semantics live in ruleMatchesRunOnly.
  return getChecksForRunOnly(runOnly, engineOptions);
}

/**
 * Node/runtime runner.
 */
function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  assertPageBuiltins();
  // Under strictOptions the options are checked before the selection is
  // worked out from them, as they are said to be.
  if (strictOf(engineOptions)) enforceEngineOptions(engineOptions);
  return runCore(
    pageUrl,
    contextSelector,
    engineOptions,
    resolveEffectiveRunOnly(engineOptions, runOnly),
    CHECK_DEFS,
    RULE_IMPLS,
    ENGINE_TAG,
    SCHEMA_VERSION,
    COMPOSITE_RULES
  );
}

// How far each shipped translation covers the English dictionary, computed
// from the dictionaries inlined above, so it describes exactly what this
// package ships. Keys a profile leaves out of a locale on purpose (shown in
// English by choice) are not counted. See docs/I18N.md.
function getLocaleCoverage() {
  const { computeLocaleReport, sameAsEnglishFor } = require('./i18n-coverage.js');
  const source = I18N.en || {};
  const locales = Object.keys(I18N)
    .filter((locale) => locale !== 'en')
    .sort()
    .map((locale) => ({
      locale,
      ...computeLocaleReport(
        source,
        I18N[locale] || {},
        I18N_LEFT_OUT[locale],
        sameAsEnglishFor(locale)
      )
    }));
  return { sourceLocale: 'en', totalKeys: Object.keys(source).length, locales };
}

return {
  DEFAULT_POLICY,
  POLICY_CONTRACTS,
  resolvePolicy,
  CHECK_DEFS,
  TEST_DEFS,
  COMPOSITE_RULES,
  getCheckDefById,
  getChecksCatalog,
  getRulesCatalog,
  getLocaleCoverage,
  getCompositeRuleById,
  getProfileWcagTarget,
  getChecksForRunOnly,
  getTestsForRunOnly,
  runDomRulesInPage,
  // translate/resolveLocale let src/report.js label its own page from the
  // same dictionaries as the findings, without a second table to maintain.
  __internal: {
    normalizeRuleResult,
    translate: (key, fallback, params, locale) => t(key, fallback, params, { locale }),
    resolveLocale: (locale) => resolveLocale({ locale })
  }
};
}

// The package's engine: core's rules, rollups and data, each rule's code
// required from its module.
const RUNTIME_CATALOG = {
  checkDefs: ${jsStringify(defs)},
  composites: ${jsStringify(COMPOSITE_RULES)},
  impls: {
${implEntries.join(',\n')}
  },
  ...${jsStringify(data)}
};
const RUNTIME = createRuntime(RUNTIME_CATALOG);

// Every rule module the package's catalog was prepared from, relative to this
// file: a scan with packs prepares its catalog from them and the packs'
// (src/pack.js).
const RULE_MODULES = ${jsStringify(ruleModuleSpecs)};

// =======================
// SELF-CONTAINED in-page runner for page.evaluate
// =======================
${inPageRunnerSource}

// =======================
// SELF-CONTAINED cross-frame scanning for the "plain script injection"
// consumption mode (see the comment above crossFrameRunnerSource's own
// definition earlier in this file for the full reasoning).
// =======================
${crossFrameRunnerSource}

module.exports = {
  ENGINE_TAG,
  SCHEMA_VERSION,
  DEFAULT_POLICY: RUNTIME.DEFAULT_POLICY,
  POLICY_CONTRACTS: RUNTIME.POLICY_CONTRACTS,
  resolvePolicy: RUNTIME.resolvePolicy,
  CHECK_DEFS: RUNTIME.CHECK_DEFS,
  TEST_DEFS: RUNTIME.TEST_DEFS,
  COMPOSITE_RULES: RUNTIME.COMPOSITE_RULES,
  getCheckDefById: RUNTIME.getCheckDefById,
  getChecksCatalog: RUNTIME.getChecksCatalog,
  getRulesCatalog: RUNTIME.getRulesCatalog,
  getLocaleCoverage: RUNTIME.getLocaleCoverage,
  getCompositeRuleById: RUNTIME.getCompositeRuleById,
  getProfileWcagTarget: RUNTIME.getProfileWcagTarget,
  getChecksForRunOnly: RUNTIME.getChecksForRunOnly,
  getTestsForRunOnly: RUNTIME.getTestsForRunOnly,
  runDomRulesInPage: RUNTIME.runDomRulesInPage,
  runa11yCoreInPage,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder,
  waitForPageReady,
  getMargins,
  __internal: { ...RUNTIME.__internal, createRuntime, catalog: RUNTIME_CATALOG, ruleModules: RULE_MODULES }
};
`;
}

function main() {
  const mods = loadRuleModules();
  const i18nAll = loadAllTranslations();

  const compositeRulesCatalog = loadCompositeRulesCatalog();

  const out = generateCore(
    mods,
    i18nAll,
    compositeRulesCatalog,
    Object.keys(i18nAll),
    keysLeftOut()
  );

  fs.writeFileSync(OUTPUT_FILE, `/* SPDX-License-Identifier: MPL-2.0 */\n\n${out}`, 'utf8');

  console.log(`[build-core] wrote ${path.relative(ROOT_DIR, OUTPUT_FILE)} (${mods.length} rules)`);
}

module.exports = {
  ruleModuleEntries,
  loadRuleModules,
  loadAllTranslations,
  keysLeftOut,
  loadCompositeRulesCatalog,
  generateCore
};

if (require.main === module) {
  main();
}
