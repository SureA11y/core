'use strict';

/**
 * Build the generated core (src/core.js) from rule modules under src/rules.
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
 * runOnly supports:
 * - { tags?: string[] }
 * - { includeRuleIds?: string[] }
 * - { excludeRuleIds?: string[] }
 */

const fs = require('fs');
const path = require('path');

const { POLICY_CONTRACTS } = require('../src/policy/contracts');
const { resolvePolicy } = require('../src/policy/resolvePolicy');
const { normalizeSelectorList, createDomHelpers } = require('../src/core/dom-helpers');
const { runCore } = require('../src/core/dom-runner');
const { createContrastHelpers } = require('../src/core/contrast-helpers');

const ENGINE_TAG = 'a11ycore';
const SCHEMA_VERSION = '1.0.0';

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const RULES_DIR = path.join(SRC_DIR, 'rules');
const OUTPUT_FILE = path.join(SRC_DIR, 'core.js');

const I18N_DIR = path.join(SRC_DIR, 'i18n');

function isI18nLocaleFile(name) {
  // supports en.js, fr.js, pt-BR.js, etc.
  return typeof name === 'string' && /^[a-z]{2}(-[A-Za-z0-9]+)?\.(cjs|mjs|js)$/.test(name);
}

function localeFromFileName(name) {
  return name.replace(/\.(cjs|mjs|js)$/, '');
}

function loadAllTranslations() {
  if (!fs.existsSync(I18N_DIR)) return { en: {} };

  const files = fs.readdirSync(I18N_DIR).filter(isI18nLocaleFile);
  const out = {};

  for (const file of files) {
    const locale = localeFromFileName(file);
    const abs = path.join(I18N_DIR, file);

    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(abs);

      // Support both module.exports and export default
      const dict =
          mod && typeof mod === 'object' && mod.default && typeof mod.default === 'object'
              ? mod.default
              : mod;

      out[locale] = (dict && typeof dict === 'object' && !Array.isArray(dict)) ? dict : {};
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[build-core] failed to load i18n file ${file}; skipping`, e && e.message ? e.message : e);
    }
  }

  if (!out.en) out.en = {};
  return out;
}

function isRuleFileName(fullPath) {
  const base = path.basename(fullPath);

  // Exclude ONLY the top-level rules index (src/rules/index.*),
  // but allow nested index.js (e.g. src/rules/manual-review/index.js)
  const isTopLevelIndex =
      path.dirname(fullPath) === RULES_DIR &&
      (base === 'index.js' || base === 'index.cjs' || base === 'index.mjs');

  if (isTopLevelIndex) return false;

  if (base.endsWith('.test.js') || base.endsWith('.test.cjs') || base.endsWith('.test.mjs')) return false;

  return base.endsWith('.js') || base.endsWith('.cjs') || base.endsWith('.mjs');
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
    // eslint-disable-next-line global-require, import/no-dynamic-require
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
            : (typeof mod.default.id === 'string' && typeof mod.default.runInPage === 'function');
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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

function normalizeObjectArray(value) {
  if (!Array.isArray(value)) return [];
  return value
      .filter((v) => v && typeof v === 'object' && !Array.isArray(v))
      .map((v) => ({ ...v }));
}

function normalizeRuleMeta(ruleId, id, meta) {
  const m = (meta && typeof meta === 'object') ? meta : {};

  const title = (typeof m.title === 'string' && m.title.trim()) ? m.title.trim() : id;
  const description = (typeof m.description === 'string') ? m.description : '';
  const helpUrl = (typeof m.helpUrl === 'string') ? m.helpUrl : '';

  const i18n = (m.i18n && typeof m.i18n === 'object' && !Array.isArray(m.i18n))
      ? { ...m.i18n }
      : null;

  const tags = normalizeStringArray(m.tags).map((t) => t.toLowerCase());
  if (!tags.includes(ENGINE_TAG)) tags.push(ENGINE_TAG);

  const normativeMappings = normalizeObjectArray(m.normativeMappings);
  const informativeReferences = normalizeObjectArray(m.informativeReferences);

  const defaultSeverity = (typeof m.defaultSeverity === 'string' && m.defaultSeverity.trim())
      ? m.defaultSeverity.trim()
      : 'moderate';

  const defaultConfidence = (typeof m.defaultConfidence === 'string' && m.defaultConfidence.trim())
      ? m.defaultConfidence.trim()
      : 'medium';

  const type = (m.type === 'manual' || m.type === 'automatic')
      ? m.type
      : 'automatic';

  const coverage = (m.coverage === null || typeof m.coverage === 'string' || typeof m.coverage === 'object')
      ? m.coverage
      : null;

  // Contract fields (normalized at build-time; no runtime mutation needed)
  const ruleInterfaceVersion = (typeof m.ruleInterfaceVersion === 'string' && m.ruleInterfaceVersion.trim())
      ? m.ruleInterfaceVersion.trim()
      : '1.0.0';

  const ruleVersion = (typeof m.ruleVersion === 'string' && m.ruleVersion.trim())
      ? m.ruleVersion.trim()
      : '0.0.0';

  const normative = (typeof m.normative === 'boolean') ? m.normative : true;
  const atomic = (typeof m.atomic === 'boolean') ? m.atomic : true;

  const category = (typeof m.category === 'string' && m.category.trim()) ? m.category.trim() : null;
  const standard = (typeof m.standard === 'string' && m.standard.trim()) ? m.standard.trim() : null;

  const applicability = (typeof m.applicability === 'string') ? m.applicability : '';
  const expectation = (typeof m.expectation === 'string') ? m.expectation : '';

  const references = Array.isArray(m.references) ? m.references.slice() : [];
  const requirements = (m.requirements === null || typeof m.requirements === 'string' || typeof m.requirements === 'object')
      ? m.requirements
      : null;

  const mappings = (m.mappings === null || typeof m.mappings === 'string' || typeof m.mappings === 'object')
      ? m.mappings
      : null;

  // Minimal validation (fail fast at build time)
  if (!Array.isArray(tags)) throw new Error(`Rule ${ruleId}: meta.tags must be an array`);
  if (!Array.isArray(normativeMappings)) throw new Error(`Rule ${ruleId}: meta.normativeMappings must be an array`);
  if (!Array.isArray(informativeReferences)) throw new Error(`Rule ${ruleId}: meta.informativeReferences must be an array`);
  if (type !== 'automatic' && type !== 'manual') throw new Error(`Rule ${ruleId}: meta.type must be "automatic" or "manual"`);

  if (i18n) {
    if (typeof i18n.titleKey !== 'string' || !i18n.titleKey.trim()) {
      throw new Error(`Rule ${ruleId}: meta.i18n.titleKey must be a non-empty string`);
    }
    if (i18n.descriptionKey != null && (typeof i18n.descriptionKey !== 'string' || !i18n.descriptionKey.trim())) {
      throw new Error(`Rule ${ruleId}: meta.i18n.descriptionKey must be a non-empty string when provided`);
    }
  }

  return {
    title,
    description,
    i18n,
    helpUrl,
    tags,
    normativeMappings,
    informativeReferences,
    defaultSeverity,
    defaultConfidence,
    type,
    coverage,

    ruleInterfaceVersion,
    ruleVersion,
    normative,
    atomic,
    category,
    standard,
    applicability,
    expectation,
    references,
    requirements,
    mappings
  };
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

    const meta = (mod.meta && typeof mod.meta === 'object') ? mod.meta : {};

    const ruleId = id;

    const runFnSource = mod.runInPage.toString();

    const applicabilityFn =
        (typeof mod.applicability === 'function') ? mod.applicability : null;

    const applicabilityFnSource =
        (typeof applicabilityFn === 'function') ? applicabilityFn.toString() : null;

    const normalizedMeta = normalizeRuleMeta(ruleId, id, meta);

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

  mods.sort((a, b) => a.ruleId.localeCompare(b.ruleId, undefined, { numeric: true, sensitivity: 'base' }));
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
    throw new Error(`${name} must be JSON-serializable. ${e && e.message ? e.message : e}`);
  }
}

/**
 * Generate src/core.js as a single CommonJS module.
 */
function generateCore(mods, i18nAll) {
  const defs = mods.map((m) => ({
    ruleId: m.ruleId,
    title: m.meta.title,
    description: m.meta.description,
    i18n: m.meta.i18n,
    helpUrl: m.meta.helpUrl,
    tags: m.meta.tags,
    normativeMappings: m.meta.normativeMappings,
    informativeReferences: m.meta.informativeReferences,
    defaultSeverity: m.meta.defaultSeverity,
    defaultConfidence: m.meta.defaultConfidence,
    type: m.meta.type,
    coverage: m.meta.coverage,

    // Optional rule metadata payload for apps/AI (JSON-serializable)
    data: (m.data === undefined ? null : m.data),

    // contract fields
    ruleInterfaceVersion: m.meta.ruleInterfaceVersion,
    ruleVersion: m.meta.ruleVersion,
    normative: m.meta.normative,
    atomic: m.meta.atomic,
    category: m.meta.category,
    standard: m.meta.standard,
    applicability: m.meta.applicability,
    expectation: m.meta.expectation,
    references: m.meta.references,
    requirements: m.meta.requirements,
    mappings: m.meta.mappings
  }));

  // Node/runtime implementations (require at runtime in Node, used by tests and server-side use).
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

function normalizeLocale(locale) {
  if (typeof locale !== 'string') return 'en';
  const s = locale.trim();
  return s ? s : 'en';
}

function getLocaleDict(engineOptions) {
  const loc = normalizeLocale(engineOptions && engineOptions.locale);
  return (I18N && I18N[loc]) ? I18N[loc] : (I18N && I18N.en ? I18N.en : {});
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
    const tagRe = /\\{\\{\\s*([#^\/]?)([^}\\s]+)\\s*\\}\\}/g;

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

  const dict = getLocaleDict(engineOptions);
  const v = dict ? dict[key] : null;

  // fallback to English if missing in requested locale
  const vEn = (I18N && I18N.en) ? I18N.en[key] : null;

  const base =
    (typeof v === 'string' && v) ? v :
    (typeof vEn === 'string' && vEn) ? vEn :
    (typeof fallback === 'string' ? fallback : '');

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
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values) && runOnly.values.length) return true;
  if (Array.isArray(runOnly.tags) && runOnly.tags.length) return true;
  if (Array.isArray(runOnly.includeRuleIds) && runOnly.includeRuleIds.length) return true;
  if (Array.isArray(runOnly.excludeRuleIds) && runOnly.excludeRuleIds.length) return true;
  // extended (new)
  if (Array.isArray(runOnly.excludeTags) && runOnly.excludeTags.length) return true;
  if (typeof runOnly.includeMode === 'string' && runOnly.includeMode.trim()) return true;
  return false;
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
 * { includeMode, tags, excludeTags, includeRuleIds, excludeRuleIds }
 */
function normalizeRunOnly(runOnly) {
  const out = { includeMode: 'and', tags: [], excludeTags: [], includeRuleIds: [], excludeRuleIds: [] };
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

  const includeRuleIds = parseCommaList(rules && rules.include, { lower: false });
  const excludeRuleIds = parseCommaList(rules && rules.exclude, { lower: false });

  const includeTags = parseCommaList(tags && tags.include, { lower: true });
  const excludeTags = parseCommaList(tags && tags.exclude, { lower: true });

  return {
    includeMode: mode,
    tags: includeTags,
    excludeTags,
    includeRuleIds,
    excludeRuleIds
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

function ruleMatchesRunOnly(def, runOnly, engineTag) {
  const norm = normalizeRunOnly(runOnly);
  const includeMode = normalizeIncludeMode(norm.includeMode);

  const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];

  const hasIdInclude = norm.includeRuleIds.length > 0;
  const hasTagInclude = norm.tags.length > 0;

  let idMatch = true;
  let tagMatch = true;

  if (hasIdInclude) {
    idMatch = norm.includeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
  }
  if (hasTagInclude) {
    tagMatch = defTags.some((t) => norm.tags.includes(t));
  }

  // Includes
  if (hasIdInclude || hasTagInclude) {
    if (includeMode === 'or' && hasIdInclude && hasTagInclude) {
      if (!(idMatch || tagMatch)) return false;
    } else {
      // 'and' semantics (or only one include dimension present)
      if (hasIdInclude && !idMatch) return false;
      if (hasTagInclude && !tagMatch) return false;
    }
  }

  // Excludes (always subtractive; apply after include)
  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
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
    category: def.category || null,
    normativeMappings: Array.isArray(def.normativeMappings) ? def.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(def.informativeReferences) ? def.informativeReferences.map((o) => ({ ...o })) : [],
    standard: def.standard || null,
    applicability: def.applicability || '',
    expectation: def.expectation || '',
    references: Array.isArray(def.references) ? def.references.slice() : [],
    requirements: def.requirements || null,
    mappings: def.mappings || null
  };

  out.schemaVersion = schemaVersion;

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  out.occurrences = occ.map((item) => {
    const o = item && typeof item === 'object' ? { ...item } : {};

    // Engine-side finalization (only if rule reported a node)
    const node = o.__node || null;
    if (node) delete o.__node;

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
    normativeMappings: Array.isArray(r.normativeMappings) ? r.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(r.informativeReferences) ? r.informativeReferences.map((o) => ({ ...o })) : [],
    defaultSeverity: r.defaultSeverity,
    defaultConfidence: r.defaultConfidence,
    type: r.type,
    coverage: r.coverage || null,

    data: (r.data === undefined ? null : r.data),

    ruleInterfaceVersion: r.ruleInterfaceVersion,
    ruleVersion: r.ruleVersion,
    normative: r.normative,
    atomic: r.atomic,
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

// Inlined from src/core/dom-helpers.js
${inlineConstFunction('normalizeSelectorList', normalizeSelectorList)}
${inlineConstFunction('createDomHelpers', createDomHelpers)}

// Inlined from src/core/dom-runner.js
${inlineConstFunction('runCore', runCore)}
`.trim();

  const inPageRunnerSource = `
function runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
  const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};

  const RULE_DEFS = ${jsStringify(defs)};

  const RULE_IMPLS = {
${implEntriesInPage.join(',\n')}
  };

  ${runnersSharedSource}

  return runCore(pageUrl, contextSelector, engineOptions, resolveEffectiveRunOnly(engineOptions, runOnly), RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION);
}
`.trim();

  return `'use strict';

const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};
const SCHEMA_VERSION = ${jsStringify(SCHEMA_VERSION)};

// Rule catalog (data only)
const RULE_DEFS = ${jsStringify(defs)};

// Node/runtime rule implementations (normalized)
const RULE_IMPLS = {
${implEntries.join(',\n')}
};

${runnersSharedSource}

function getRuleDefById(ruleId, engineOptions) {
  const r = RULE_DEFS.find((x) => x.ruleId === ruleId) || null;
  return r ? toCatalogEntry(r, engineOptions) : null;
}

function getRulesCatalog(engineOptions) {
  return RULE_DEFS.map((r) => toCatalogEntry(r, engineOptions));
}

function getRulesForRunOnly(runOnly, engineOptions) {
  return RULE_DEFS
    .filter((r) => ruleMatchesRunOnly(r, resolveEffectiveRunOnly(engineOptions, runOnly), ENGINE_TAG))
    .map((r) => toCatalogEntry(r, engineOptions));
}

/**
 * Node/runtime runner.
 */
function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  return runCore(pageUrl, contextSelector, engineOptions, resolveEffectiveRunOnly(engineOptions, runOnly), RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION);
}

// =======================
// SELF-CONTAINED in-page runner for page.evaluate
// =======================
${inPageRunnerSource}

module.exports = {
  ENGINE_TAG,
  SCHEMA_VERSION,
  DEFAULT_POLICY,
  POLICY_CONTRACTS,
  resolvePolicy,
  RULE_DEFS,
  getRuleDefById,
  getRulesCatalog,
  getRulesForRunOnly,
  runDomRulesInPage,
  runa11yCoreInPage,
  __internal: { normalizeRuleResult }
};
`;
}

function main() {
  const mods = loadRuleModules();
  const i18nAll = loadAllTranslations();
  const out = generateCore(mods, i18nAll);
  fs.writeFileSync(OUTPUT_FILE, out, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[build-core] wrote ${path.relative(ROOT_DIR, OUTPUT_FILE)} (${mods.length} rules)`);
}

main();
