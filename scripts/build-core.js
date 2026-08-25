'use strict';

/**
 * Build the generated core (src/core.js) from rule modules under src/checks.
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
  resolveContextRoots,
  createDomHelpers
} = require('../src/core/dom-helpers');
const { runCore } = require('../src/core/dom-runner');
const { createContrastHelpers } = require('../src/core/contrast-helpers');
const { createAriaHelpers } = require('../src/core/aria-helpers');
const { normalizeRuleMeta } = require('../src/core/rule-meta');
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
  getFrameElementUrl,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder
} = require('../src/core/frame-scan');

const ENGINE_TAG = 'a11ycore';
const SCHEMA_VERSION = '1.0.0';

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const RULES_DIR = path.join(SRC_DIR, 'checks');
const OUTPUT_FILE = path.join(SRC_DIR, 'core.js');

const I18N_DIR = path.join(SRC_DIR, 'i18n');

const CATALOGS_DIR = path.join(SRC_DIR, 'catalogs');
const COMPOSITE_RULES_FILE = path.join(CATALOGS_DIR, 'composites.wcag.js');

function isI18nLocaleFile(name) {
  // supports en.json, fr.json, pt-BR.json, etc.
  return typeof name === 'string' && /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(name);
}

function localeFromFileName(name) {
  return name.replace(/\.json$/, '');
}

function loadCompositeRulesCatalog() {
  if (!fs.existsSync(COMPOSITE_RULES_FILE)) return [];

  const raw = require(COMPOSITE_RULES_FILE);

  if (!Array.isArray(raw)) {
    throw new Error(
      `[build-core] ${path.relative(ROOT_DIR, COMPOSITE_RULES_FILE)} must export an array`
    );
  }

  const seen = new Set();
  return raw.map((entry, idx) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`[build-core] composite rule entry at index ${idx} must be an object`);
    }

    const id = String(entry.id || '').trim();
    const checksIds = Array.isArray(entry.checksIds)
      ? entry.checksIds.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (!id) throw new Error(`[build-core] composite rule entry at index ${idx} is missing "id"`);
    if (seen.has(id)) throw new Error(`[build-core] duplicate composite rule id: ${id}`);
    if (!checksIds.length)
      throw new Error(`[build-core] composite rule "${id}" must include at least one testId`);

    seen.add(id);

    return {
      id,
      checksIds,
      meta:
        entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
          ? entry.meta
          : null
    };
  });
}

function loadAllTranslations() {
  if (!fs.existsSync(I18N_DIR)) return { en: {} };

  const files = fs.readdirSync(I18N_DIR).filter(isI18nLocaleFile);
  const out = {};

  for (const file of files) {
    const locale = localeFromFileName(file);
    const abs = path.join(I18N_DIR, file);

    try {
      const dict = JSON.parse(fs.readFileSync(abs, 'utf8'));

      out[locale] = dict && typeof dict === 'object' && !Array.isArray(dict) ? dict : {};
    } catch (e) {
      console.warn(
        `[build-core] failed to load i18n file ${file}; skipping`,
        e && e.message ? e.message : e
      );
    }
  }

  if (!out.en) out.en = {};
  return out;
}

function isRuleFileName(fullPath) {
  const base = path.basename(fullPath);

  // Exclude ONLY the top-level checks index (src/checks/index.*),
  // but allow nested index.js (e.g. src/checks/manual-review/index.js)
  const isTopLevelIndex =
    path.dirname(fullPath) === RULES_DIR &&
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

function loadRuleModules() {
  const files = listRuleFilesRecursive(RULES_DIR);

  const mods = [];
  for (const file of files) {
    const mod = unwrapModule(safeRequire(file));

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

    const normalizedMeta = normalizeRuleMeta(ruleId, id, meta, ENGINE_TAG);

    const data = assertJsonSerializable(`Rule ${ruleId}: export "data"`, mod.data);

    mods.push({
      file,
      id,
      ruleId,
      runFnSource,
      applicabilityFnSource,
      meta: normalizedMeta,
      data
    });
  }

  mods.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId, undefined, { numeric: true, sensitivity: 'base' })
  );
  return mods;
}

function jsStringify(obj) {
  return JSON.stringify(obj, null, 2);
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

/**
 * Generate src/core.js as a single CommonJS module.
 */
function generateCore(mods, i18nAll, compositeRulesCatalog, knownLocalesArg) {
  // Defaults to the inlined set; the browser build inlines only en but still
  // passes the full list, so an omitted table reports dictionary-not-loaded
  // rather than pretending the language does not exist.
  const knownLocales = (knownLocalesArg || Object.keys(i18nAll || { en: {} })).slice().sort();

  const defs = mods.map((m) => ({
    ruleId: m.ruleId,
    title: m.meta.title,
    description: m.meta.description,
    i18n: m.meta.i18n,
    helpUrl: m.meta.helpUrl,
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
    mappings: m.meta.mappings
  }));

  const COMPOSITE_RULES = Array.isArray(compositeRulesCatalog) ? compositeRulesCatalog : [];

  // Validate composite checks against the loaded atomic checks (fail fast at build time)
  const knownRuleIds = new Set(defs.map((d) => d.ruleId));
  for (const cr of COMPOSITE_RULES) {
    if (!cr || typeof cr !== 'object') continue;
    const cid = String(cr.id || '').trim();
    const ids = Array.isArray(cr.checksIds) ? cr.checksIds : [];
    for (const tid of ids) {
      const rid = String(tid || '').trim();
      if (!rid) continue;
      if (!knownRuleIds.has(rid)) {
        throw new Error(`[build-core] composite rule "${cid}" references unknown testId: ${rid}`);
      }
    }
  }

  // Node/runtime implementations (require at runtime in Node, used by checks and server-side use).
  // Normalize to a single shape: { run, applicability }
  const implEntries = mods.map((m) => {
    const rel = './' + path.relative(SRC_DIR, m.file).replace(/\\/g, '/');
    return `  ${jsStringify(m.ruleId)}: { run: require(${jsStringify(rel)}).runInPage, applicability: require(${jsStringify(rel)}).applicability || null }`;
  });

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
const I18N = ${jsStringify(i18nAll || { en: {} })};

// Every locale the project ships, whether or not its table was inlined here.
// Lets an absent dictionary be told apart from a language that does not exist.
const KNOWN_LOCALES = ${jsStringify(knownLocales)};

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

    for (const key in en) {
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

    // Tokenize: {{...}}
    const tagRe = /\\{\\{\\s*([#^/]?)([^}\\s]+)\\s*\\}\\}/g;

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

function parseCommaList(value, { lower = false } = {}) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const arr = value.map(String).map((s) => s.trim()).filter(Boolean);
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
    excludeTestIds: []
  };
  if (!runOnly || typeof runOnly !== 'object') return out;

  out.includeMode = normalizeIncludeMode(runOnly.includeMode);

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
 * Resolve effective selection from engineOptions (preferred) or runOnly (legacy).
 *
 * Precedence:
 * - If runOnly is provided and non-empty => use it (legacy behavior, plus extended fields)
 * - Else => derive from engineOptions.rules/tags/includeMode (comma-separated strings)
 */
function resolveEffectiveRunOnly(engineOptions, runOnly) {
  if (hasAnyRunOnlyKeys(runOnly)) return normalizeRunOnly(runOnly);

  const eo = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
  const mode = normalizeIncludeMode(eo.includeMode);

  const rules = (eo.rules && typeof eo.rules === 'object') ? eo.rules : null;
  const tags = (eo.tags && typeof eo.tags === 'object') ? eo.tags : null;
  const tests = (eo.tests && typeof eo.tests === 'object') ? eo.tests : null;

  const includeRuleIds = parseCommaList(rules && rules.include, { lower: false });
  const excludeRuleIds = parseCommaList(rules && rules.exclude, { lower: false });

  const includeTags = parseCommaList(tags && tags.include, { lower: true });
  const excludeTags = parseCommaList(tags && tags.exclude, { lower: true });

  const includeTestIds = parseCommaList(tests && tests.include, { lower: false });
  const excludeTestIds = parseCommaList(tests && tests.exclude, { lower: false });

  return {
    includeMode: mode,
    tags: includeTags,
    excludeTags,
    includeRuleIds,
    excludeRuleIds,
    includeTestIds,
    excludeTestIds
  };

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

function expandCompositeRuleId(candidateId) {
  const id = typeof candidateId === 'string' ? candidateId.trim() : '';
  if (!id) return null;
  const checksIds = COMPOSITE_RULE_INDEX[id];
  return Array.isArray(checksIds) && checksIds.length ? checksIds : null;
}

function ruleMatchesRunOnly(def, runOnly, engineTag) {
  const norm = normalizeRunOnly(runOnly);
  const includeMode = normalizeIncludeMode(norm.includeMode);

  const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];

  const hasRuleInclude = norm.includeRuleIds.length > 0;
  const hasTestInclude = norm.includeTestIds.length > 0;
  const hasTagInclude = norm.tags.length > 0;

  let idMatch = true;
  let tagMatch = true;

  if (hasRuleInclude) {
    idMatch = norm.includeRuleIds.some((ruleId) => {
      // 1) Direct match always wins (this allows selecting the composite itself)
      if (ruleIdMatches(ruleId, def.ruleId, engineTag || ENGINE_TAG)) return true;
      
      // 2) If candidate is a composite id, include atomic children as well
      const expanded = expandCompositeRuleId(ruleId);
      if (expanded) return expanded.includes(def.ruleId);
      
      return false;
    });
  }

  if (hasTestInclude) {
    const testMatch = norm.includeTestIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    idMatch = hasRuleInclude ? (idMatch && testMatch) : testMatch;
  }

  if (hasTagInclude) {
    tagMatch = defTags.some((t) => norm.tags.includes(t));
  }

  // Includes
  const hasAnyIdInclude = hasRuleInclude || hasTestInclude;

  if (hasAnyIdInclude || hasTagInclude) {
    if (includeMode === 'or' && hasAnyIdInclude && hasTagInclude) {
      if (!(idMatch || tagMatch)) return false;
    } else {
      // 'and' semantics (or only one include dimension present)
      if (hasAnyIdInclude && !idMatch) return false;
      if (hasTagInclude && !tagMatch) return false;
    }
  }

  // Excludes (always subtractive; apply after include)
  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((ruleId) => {
      // 1) Direct match excludes the composite itself (and any atomic with same id)
      if (ruleIdMatches(ruleId, def.ruleId, engineTag || ENGINE_TAG)) return true;
  
      // 2) If candidate is a composite id, exclude its atomic children too
      const expanded = expandCompositeRuleId(ruleId);
      if (expanded) return expanded.includes(def.ruleId);
  
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

  if (!pol.allowedOutcomes.includes(out.outcome)) out.outcome = 'cantTell';

  out.outcomeNormalized =
    out.outcome === 'notApplicable' ? 'inapplicable' : out.outcome;
    
    const output = (out.engineOptions && out.engineOptions.output && typeof out.engineOptions.output === 'object')
    ? out.engineOptions.output
    : null;

  const includeSelector = !(output && output.includeSelector === false);
  const includeHtml = !(output && output.includeHtml === false);

  const needsDetails = (out.outcome === 'fail' || out.outcome === 'cantTell');

  // Manual rules must never "fail" automatically
  if (pol.coerceManualFailToCantTell && (def.type === 'manual' || out.type === 'manual') && out.outcome === 'fail') {
    out.outcome = 'cantTell';
    out.outcomeNormalized = 'cantTell';
    out.error = (out.error ? String(out.error) + ' | ' : '') + 'Manual rules cannot return outcome=fail; coerced to cantTell.';
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
    normativeMappings: Array.isArray(def.normativeMappings) ? def.normativeMappings.map((o) => ({ ...o })) : [],
    standard: def.standard || null,
    applicability: def.applicability || '',
    expectation: def.expectation || '',
    references: Array.isArray(def.references) ? def.references.slice() : [],
    requirements: def.requirements || null,
    mappings: def.mappings || null
  };

  out.schemaVersion = schemaVersion;

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  let __truncatedOccurrences = 0;
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

  if (raw && raw.error) out.error = String(raw.error);

  return out;
}

function toCatalogEntry(r, engineOptions) {
  return {
    ruleId: r.ruleId,
    title: (r && r.i18n ? t(r.i18n.titleKey, r.title, null, engineOptions) : r.title),
    description: (r && r.i18n ? t(r.i18n.descriptionKey, r.description, null, engineOptions) : r.description),
    i18n: r.i18n || null,
    helpUrl: r.helpUrl,
    tags: Array.isArray(r.tags) ? r.tags.slice() : [],
    wcagSc: Array.isArray(r.wcagSc) ? r.wcagSc.slice() : [],
    normativeMappings: Array.isArray(r.normativeMappings) ? r.normativeMappings.map((o) => ({ ...o })) : [],
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
    mappings: r.mappings || null
  };
}

// Inlined from src/core/contrast-helpers.js
${inlineConstFunction('createContrastHelpers', createContrastHelpers)}

// Inlined from src/core/aria-helpers.js
${inlineConstFunction('createAriaHelpers', createAriaHelpers)}

// Inlined from src/core/dom-helpers.js
${inlineConstFunction('normalizeSelectorList', normalizeSelectorList)}
${inlineConstFunction('resolveContextRoots', resolveContextRoots)}
${inlineConstFunction('createDomHelpers', createDomHelpers)}

// Inlined from src/core/rule-meta.js (also used at build time by loadRuleModules
// above -- single source of truth -- and here so runtime-registered custom
// rules via engineOptions.customRules get identical meta defaulting/validation
// to build-time rules; see runCore's own customRules handling)
${inlineConstFunction('normalizeRuleMeta', normalizeRuleMeta)}

// Inlined from src/core/dom-runner.js
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
  const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
  const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};

  // Rule catalog (data only)
  const CHECK_DEFS = ${jsStringify(defs)};

  // Tests catalog (alias of CHECK_DEFS; tests are the atomic executable units)
  const TEST_DEFS = CHECK_DEFS;

  // Composite rules catalog (data only)
  const COMPOSITE_RULES = ${jsStringify(COMPOSITE_RULES)};

  const RULE_IMPLS = {
${implEntriesInPage.join(',\n')}
  };

  ${runnersSharedSource}

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
${inlineConstFunction('getFrameRpcRegistry', getFrameRpcRegistry)}
${inlineConstFunction('installFrameRpcListener', installFrameRpcListener)}
${inlineConstFunction('nextFrameRpcRequestId', nextFrameRpcRequestId)}
${inlineConstFunction('pingFrame', pingFrame)}
${inlineConstFunction('sendFrameRunCommand', sendFrameRunCommand)}
${inlineConstFunction('enableFrameRpcResponder', enableFrameRpcResponder)}
${inlineConstFunction('normalizeSelectorList', normalizeSelectorList)}
${inlineConstFunction('resolveContextRoots', resolveContextRoots)}

${findChildFrameElements.toString()}

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
`.trim();

  return `'use strict';

const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};

// Rule catalog (data only)
const CHECK_DEFS = ${jsStringify(defs)};

// Tests catalog (alias of CHECK_DEFS; tests are the atomic executable units)
const TEST_DEFS = CHECK_DEFS;

// Composite rules catalog (data only)
const COMPOSITE_RULES = ${jsStringify(COMPOSITE_RULES)};

// Node/runtime rule implementations (normalized)
const RULE_IMPLS = {
${implEntries.join(',\n')}
};

${runnersSharedSource}

function getCheckDefById(ruleId, engineOptions) {
  const r = CHECK_DEFS.find((x) => x.ruleId === ruleId) || null;
  return r ? toCatalogEntry(r, engineOptions) : null;
}

function getChecksCatalog(engineOptions) {
  // Tests are the atomic executable units (currently stored in CHECK_DEFS).
  // We return the same catalog entries shape as rules for now.
  return CHECK_DEFS.map((r) => toCatalogEntry(r, engineOptions));
}

function getRulesCatalog() {
  // Data-only catalog. No i18n resolution yet (we can add later if needed).
  return Array.isArray(COMPOSITE_RULES) ? COMPOSITE_RULES.map((x) => ({ ...x, checksIds: Array.isArray(x.checksIds) ? x.checksIds.slice() : [] })) : [];
}

function getCompositeRuleById(ruleId) {
  if (!Array.isArray(COMPOSITE_RULES)) return null;
  const found = COMPOSITE_RULES.find((x) => x && typeof x === 'object' && x.id === ruleId) || null;
  if (!found) return null;
  return { ...found, checksIds: Array.isArray(found.checksIds) ? found.checksIds.slice() : [] };
}

function getChecksForRunOnly(runOnly, engineOptions) {
  return CHECK_DEFS
    .filter((r) => ruleMatchesRunOnly(r, resolveEffectiveRunOnly(engineOptions, runOnly), ENGINE_TAG))
    .map((r) => toCatalogEntry(r, engineOptions));
}

function getTestsForRunOnly(runOnly, engineOptions) {
  // Tests are the atomic executable units; selection semantics live in ruleMatchesRunOnly.
  return CHECK_DEFS
    .filter((r) => ruleMatchesRunOnly(r, resolveEffectiveRunOnly(engineOptions, runOnly), ENGINE_TAG))
    .map((r) => toCatalogEntry(r, engineOptions));
}

/**
 * Node/runtime runner.
 */
function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
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
  DEFAULT_POLICY,
  POLICY_CONTRACTS,
  resolvePolicy,
  CHECK_DEFS,
  TEST_DEFS,
  COMPOSITE_RULES,
  getCheckDefById,
  getChecksCatalog,
  getRulesCatalog,
  getCompositeRuleById,
  getChecksForRunOnly,
  getTestsForRunOnly,
  runDomRulesInPage,
  runa11yCoreInPage,
  runa11yCoreAcrossFrames,
  a11yCoreEnableFrameResponder,
  __internal: { normalizeRuleResult }
};
`;
}

function main() {
  const mods = loadRuleModules();
  const i18nAll = loadAllTranslations();

  const compositeRulesCatalog = loadCompositeRulesCatalog();

  const out = generateCore(mods, i18nAll, compositeRulesCatalog, Object.keys(i18nAll));

  fs.writeFileSync(OUTPUT_FILE, `/* SPDX-License-Identifier: MPL-2.0 */\n\n${out}`, 'utf8');

  console.log(`[build-core] wrote ${path.relative(ROOT_DIR, OUTPUT_FILE)} (${mods.length} rules)`);
}

module.exports = {
  I18N_DIR,
  loadRuleModules,
  loadAllTranslations,
  loadCompositeRulesCatalog,
  generateCore
};

if (require.main === module) {
  main();
}
