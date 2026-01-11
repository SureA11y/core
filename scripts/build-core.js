'use strict';

/**
 * Build the generated core (src/core.js) from rule modules under src/rules.
 *
 * IMPORTANT DESIGN GOAL:
 * - The exported `runa11yCoreInPage` MUST be self-contained (no free vars),
 *   because consumers execute it via `page.evaluate(runa11yCoreInPage, ...)`.
 *
 * The generated file contains:
 * - RULE_DEFS (rule catalog)
 * - RULE_IMPLS (Node/runtime implementations via require)
 * - runDomRulesInPage (Node/runtime runner; can reference module-scope RULE_DEFS/RULE_IMPLS)
 * - runa11yCoreInPage (SELF-CONTAINED runner for page.evaluate; inlines RULE_DEFS + rule fns)
 * - getRuleDefById / getRulesCatalog / getRulesForRunOnly
 *
 * runOnly supports:
 * - { tags: string[] }
 * - { includeRuleIds: string[] }
 * - { excludeRuleIds: string[] }
 * - legacy: { type: 'tag', values: string[] }
 *
 * Rule modules support BOTH exports:
 * - modern: { id, meta, runInPage(ctx) }
 * - legacy: { id, meta, evaluate(ctx) }
 */

const fs = require('fs');
const path = require('path');

const ENGINE_TAG = 'a11yCore';

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const RULES_DIR = path.join(SRC_DIR, 'rules');
const OUTPUT_FILE = path.join(SRC_DIR, 'core.js');

function isRuleFileName(fileName) {
  if (fileName === 'index.js' || fileName === 'index.cjs' || fileName === 'index.mjs') return false;
  if (fileName.endsWith('.test.js') || fileName.endsWith('.test.cjs') || fileName.endsWith('.test.mjs')) return false;
  return fileName.endsWith('.js') || fileName.endsWith('.cjs') || fileName.endsWith('.mjs');
}

function listRuleFilesRecursive(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) out.push(...listRuleFilesRecursive(full));
    else if (ent.isFile() && isRuleFileName(ent.name)) out.push(full);
  }
  return out;
}

function safeRequire(file) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(file);
}

function loadRuleModules() {
  const files = listRuleFilesRecursive(RULES_DIR);

  const mods = [];
  for (const file of files) {
    const mod = safeRequire(file);

    const id = mod && typeof mod.id === 'string'
      ? String(mod.id)
      : path.basename(file).replace(/\.(cjs|mjs|js)$/, '');

    const meta = mod && mod.meta ? mod.meta : {};

    // Accept modern + legacy rule function names
    const fnExport =
      (mod && typeof mod.runInPage === 'function') ? 'runInPage'
        : (mod && typeof mod.evaluate === 'function') ? 'evaluate'
          : null;

    if (!mod || typeof mod.id !== 'string' || !fnExport) {
      throw new Error(`Rule ${file} must export { id, meta, runInPage(ctx) } (or legacy evaluate(ctx)).`);
    }

    const fn = mod[fnExport];
    if (typeof fn !== 'function') {
      throw new Error(`Rule ${file} export ${fnExport} is not a function`);
    }

    // Capture the function source so we can inline it into the self-contained in-page runner.
    // NOTE: Rule functions MUST be page-safe (no Node requires, no closure on module vars).
    const fnSource = fn.toString();

    const ruleId =
      (meta && typeof meta.ruleId === 'string' && meta.ruleId.trim())
        ? meta.ruleId.trim()
        : `${ENGINE_TAG}-${id}`;

    const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
    if (!tags.includes(ENGINE_TAG)) tags.push(ENGINE_TAG);

    const wcagSc = Array.isArray(meta.wcagSc) ? meta.wcagSc.map(String) : [];

    mods.push({
      file,
      id,
      ruleId,
      fnExport,
      fnSource,
      meta: {
        title: meta.title || id,
        description: meta.description || '',
        helpUrl: meta.helpUrl || '',
        tags,
        wcagSc,
        defaultSeverity: meta.defaultSeverity || 'moderate',
        defaultConfidence: meta.defaultConfidence || 'medium',
        type: meta.type || (meta.automatic === false ? 'manual' : 'automatic'),
        coverage: meta.coverage || null
      }
    });
  }

  // Stable ordering
  mods.sort((a, b) => a.ruleId.localeCompare(b.ruleId, undefined, { numeric: true, sensitivity: 'base' }));
  return mods;
}

function jsStringify(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Generate src/core.js as a single CommonJS module.
 */
function generateCore(mods) {
  const defs = mods.map((m) => ({
    ruleId: m.ruleId,
    title: m.meta.title,
    description: m.meta.description,
    helpUrl: m.meta.helpUrl,
    tags: m.meta.tags,
    wcagSc: m.meta.wcagSc,
    defaultSeverity: m.meta.defaultSeverity,
    defaultConfidence: m.meta.defaultConfidence,
    type: m.meta.type,
    coverage: m.meta.coverage
  }));

  // Node/runtime implementations (require at runtime in Node, used by tests and server-side use).
  const implEntries = mods.map((m) => {
    const rel = './' + path.relative(SRC_DIR, m.file).replace(/\\/g, '/');
    return `  ${jsStringify(m.ruleId)}: require(${jsStringify(rel)}).${m.fnExport}`;
  });

  // In-page implementations (inline function sources; used ONLY by runa11yCoreInPage).
  const implEntriesInPage = mods.map((m) => {
    // Wrap in parentheses so it parses as an expression.
    return `    ${jsStringify(m.ruleId)}: (${m.fnSource})`;
  });

  const normalizeSelectorListSource = `
function normalizeSelectorList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') {
    // allow "#a,#b" or "#a, #b"
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
`.trim();

  // Self-contained runner source (no free vars).
  const inPageRunnerSource = `
function runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};

  // Inline catalog + rule implementations so there are NO free variables.
  const RULE_DEFS = ${jsStringify(defs)};
  const RULE_IMPLS = {
${implEntriesInPage.join(',\n')}
  };

  const VALID_OUTCOMES = ['fail', 'pass', 'cantTell', 'notApplicable'];
  const VALID_CONFIDENCE = ['high', 'medium', 'low'];

  function normalizeRuleResult(def, raw) {
    const out = raw && typeof raw === 'object' ? { ...raw } : {};
    out.ruleId = out.ruleId || def.ruleId;

    if (!VALID_OUTCOMES.includes(out.outcome)) out.outcome = 'cantTell';

    out.severity = out.severity || def.defaultSeverity || 'moderate';

    let conf = raw && raw.confidence;
    if (!VALID_CONFIDENCE.includes(conf)) conf = def.defaultConfidence || 'medium';
    out.confidence = conf;

    out.type = def.type || 'automatic';

    const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
    out.occurrences = occ.map((item) => {
      const o = item && typeof item === 'object' ? { ...item } : {};
      if (typeof o.selector !== 'string') o.selector = '';
      if (typeof o.summary !== 'string') o.summary = '';
      if (typeof o.html !== 'string') o.html = '';
      return o;
    });

    if (raw && raw.error) out.error = String(raw.error);

    return out;
  }

  function normalizeRunOnly(runOnlyArg) {
    const out = { tags: [], includeRuleIds: [], excludeRuleIds: [] };

    // legacy reference-engine-like: { type:'tag', values:[...] }
    if (runOnlyArg && typeof runOnlyArg === 'object' && runOnlyArg.type === 'tag' && Array.isArray(runOnlyArg.values)) {
      out.tags = runOnlyArg.values.map(String).map((s) => s.trim()).filter(Boolean);
      return out;
    }

    if (!runOnlyArg || typeof runOnlyArg !== 'object') return out;

    out.tags = Array.isArray(runOnlyArg.tags) ? runOnlyArg.tags.map(String).map((s) => s.trim()).filter(Boolean) : [];
    out.includeRuleIds = Array.isArray(runOnlyArg.includeRuleIds) ? runOnlyArg.includeRuleIds.map(String).map((s) => s.trim()).filter(Boolean) : [];
    out.excludeRuleIds = Array.isArray(runOnlyArg.excludeRuleIds) ? runOnlyArg.excludeRuleIds.map(String).map((s) => s.trim()).filter(Boolean) : [];

    return out;
  }

  function ruleIdMatches(candidate, ruleId, engineTag) {
    if (!candidate || !ruleId) return false;
    if (candidate === ruleId) return true;

    const prefix = (engineTag ? String(engineTag) : '') + '-';
    if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
    if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

    return false;
  }

  function ruleMatchesRunOnly(ruleDef, runOnlyArg) {
    const norm = normalizeRunOnly(runOnlyArg);

    if (norm.includeRuleIds.length) {
      const ok = norm.includeRuleIds.some((id) => ruleIdMatches(id, ruleDef.ruleId, ENGINE_TAG));
      if (!ok) return false;
    }

    if (norm.excludeRuleIds.length) {
      const blocked = norm.excludeRuleIds.some((id) => ruleIdMatches(id, ruleDef.ruleId, ENGINE_TAG));
      if (blocked) return false;
    }

    if (norm.tags.length) {
      const tags = Array.isArray(ruleDef.tags) ? ruleDef.tags : [];
      const ok = tags.some((t) => norm.tags.includes(t));
      if (!ok) return false;
    }

    return true;
  }

  const ctxSelector =
    (typeof contextSelector === 'string' && contextSelector.trim())
      ? contextSelector.trim()
      : null;

  const root =
    ctxSelector
      ? (document.querySelector(ctxSelector) ||
         document.documentElement ||
         document.body ||
         document.querySelector('html'))
      : (document.documentElement ||
         document.body ||
         document.querySelector('html'));

  const includeShadowDom = !!(engineOptions && engineOptions.includeShadowDom);

  ${normalizeSelectorListSource}

  const excludeSelectors = normalizeSelectorList(engineOptions && engineOptions.excludeSelectors);

  const url = pageUrl || (document.location && document.location.href) || null;
  const title = document.title || null;
  const timestamp = new Date().toISOString();

  function isExcluded(el) {
    if (!excludeSelectors.length || !el || !el.closest) return false;
    try {
      return excludeSelectors.some((sel) => !!el.closest(sel));
    } catch {
      return false;
    }
  }

  function queryAll(sel) {
    if (!root) return [];
    try {
      return Array.from(root.querySelectorAll(sel));
    } catch {
      return [];
    }
  }

  function queryAllDeep(sel) {
    if (!root) return [];
    const results = [];
    const seen = new Set();

    function pushAll(node) {
      if (!node || !node.querySelectorAll) return;
      let els = [];
      try {
        els = Array.from(node.querySelectorAll(sel));
      } catch {
        els = [];
      }
      for (const el of els) {
        if (el && !seen.has(el) && !isExcluded(el)) {
          seen.add(el);
          results.push(el);
        }
      }
    }

    function walk(node) {
      if (!node) return;
      if (node.nodeType === 1 && isExcluded(node)) return;

      pushAll(node);

      let all = [];
      try {
        all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
      } catch {
        all = [];
      }

      for (const el of all) {
        if (el && el.shadowRoot) walk(el.shadowRoot);
      }
    }

    walk(root);
    return results;
  }

  function queryAllSmart(sel) {
    const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
    return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
  }

  function getOuterHtmlSnippet(el) {
    if (!el || typeof el !== 'object') return '';
    try {
      const html = el.outerHTML || '';
      if (html.length > 2000) return html.slice(0, 2000) + '…';
      return html;
    } catch {
      return '';
    }
  }

  function buildSimpleSelector(el, fallbackTag) {
    try {
      if (!el || typeof el !== 'object') return fallbackTag || 'html';
      const tag = el.tagName ? el.tagName.toLowerCase() : (fallbackTag || 'html');
      const id = el.getAttribute && el.getAttribute('id');
      if (id && id.trim()) return tag + '#' + id.trim();
      const classes = (el.getAttribute && el.getAttribute('class')) || '';
      const cls = classes.split(/\\s+/).filter(Boolean);
      if (cls.length) return tag + '.' + cls[0];
      const name = el.getAttribute && el.getAttribute('name');
      if (name && name.trim()) return tag + '[name="' + name.trim() + '"]';
      return tag;
    } catch {
      return fallbackTag || 'html';
    }
  }

  function hasAccessibleName(el) {
    if (!el || typeof el !== 'object') return false;

    const ariaLabel = el.getAttribute && el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return true;

    const labelledby = el.getAttribute && el.getAttribute('aria-labelledby');
    if (labelledby && labelledby.trim()) {
      const ids = labelledby.trim().split(/\\s+/);
      for (const id of ids) {
        const ref = document.getElementById(id);
        if (ref && typeof ref.textContent === 'string' && ref.textContent.trim()) return true;
      }
    }

    const id = el.getAttribute && el.getAttribute('id');
    if (id && document.querySelector) {
      try {
        const escapedId = (window.CSS && window.CSS.escape) ? window.CSS.escape(id) : id;
        const explicitLabel = document.querySelector('label[for="' + escapedId + '"]');
        if (explicitLabel && explicitLabel.textContent && explicitLabel.textContent.trim()) return true;
      } catch {
        try {
          const explicitLabel = document.querySelector('label[for="' + id + '"]');
          if (explicitLabel && explicitLabel.textContent && explicitLabel.textContent.trim()) return true;
        } catch {}
      }
    }

    if (el.closest) {
      const wrapLabel = el.closest('label');
      if (wrapLabel && wrapLabel.textContent && wrapLabel.textContent.trim()) return true;
    }

    return false;
  }

  const sharedHelpers = {
    queryAll,
    queryAllDeep,
    queryAllSmart,
    getOuterHtmlSnippet,
    buildSimpleSelector,
    hasAccessibleName,
    isExcluded
  };

  const rulesResults = [];

  for (const def of RULE_DEFS) {
    if (!ruleMatchesRunOnly(def, runOnly)) continue;

    const impl = RULE_IMPLS[def.ruleId];
    if (typeof impl !== 'function') continue;

    const ruleConfig =
      engineOptions && engineOptions.rules && engineOptions.rules[def.ruleId]
        ? engineOptions.rules[def.ruleId]
        : null;

    const ctx = {
      document,
      window,
      root,
      rule: def,
      config: ruleConfig,
      helpers: sharedHelpers,
      engineTag: ENGINE_TAG,
      contextSelector: ctxSelector
    };

    let result;
    try {
      result = impl(ctx);
    } catch (err) {
      result = {
        ruleId: def.ruleId,
        outcome: 'cantTell',
        severity: def.defaultSeverity || 'moderate',
        occurrences: [],
        error: String(err && err.message ? err.message : err)
      };
    }

    if (!result || typeof result !== 'object') continue;
    rulesResults.push(normalizeRuleResult(def, result));
  }

  return {
    url,
    title,
    timestamp,
    contextSelector: ctxSelector,
    rules: rulesResults
  };
}
`.trim()

  return `'use strict';

const ENGINE_TAG = ${jsStringify(ENGINE_TAG)};

// Rule catalog (data only)
const RULE_DEFS = ${jsStringify(defs)};

// Node/runtime rule implementations
const RULE_IMPLS = {
${implEntries.join(',\n')}
};

// =======================
// Shared (Node/runtime) helpers
// =======================

const VALID_OUTCOMES = ['fail', 'pass', 'cantTell', 'notApplicable'];
const VALID_CONFIDENCE = ['high', 'medium', 'low'];

function normalizeRuleResult(def, raw) {
  const out = raw && typeof raw === 'object' ? { ...raw } : {};
  out.ruleId = out.ruleId || def.ruleId;

  if (!VALID_OUTCOMES.includes(out.outcome)) out.outcome = 'cantTell';

  out.severity = out.severity || def.defaultSeverity || 'moderate';

  let conf = raw && raw.confidence;
  if (!VALID_CONFIDENCE.includes(conf)) conf = def.defaultConfidence || 'medium';
  out.confidence = conf;

  out.type = def.type || 'automatic';

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  out.occurrences = occ.map((item) => {
    const o = item && typeof item === 'object' ? { ...item } : {};
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.html !== 'string') o.html = '';
    return o;
  });

  if (raw && raw.error) out.error = String(raw.error);

  return out;
}

function getRuleDefById(ruleId) {
  return RULE_DEFS.find((r) => r.ruleId === ruleId) || null;
}

function normalizeRunOnly(runOnly) {
  const out = { tags: [], includeRuleIds: [], excludeRuleIds: [] };

  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly && typeof runOnly === 'object' && runOnly.type === 'tag' && Array.isArray(runOnly.values)) {
    out.tags = runOnly.values.map(String).map((s) => s.trim()).filter(Boolean);
    return out;
  }

  if (!runOnly || typeof runOnly !== 'object') return out;

  out.tags = Array.isArray(runOnly.tags) ? runOnly.tags.map(String).map((s) => s.trim()).filter(Boolean) : [];
  out.includeRuleIds = Array.isArray(runOnly.includeRuleIds) ? runOnly.includeRuleIds.map(String).map((s) => s.trim()).filter(Boolean) : [];
  out.excludeRuleIds = Array.isArray(runOnly.excludeRuleIds) ? runOnly.excludeRuleIds.map(String).map((s) => s.trim()).filter(Boolean) : [];

  return out;
}

function ruleIdMatches(candidate, ruleId, engineTag) {
  if (!candidate || !ruleId) return false;
  if (candidate === ruleId) return true;

  const prefix = (engineTag ? String(engineTag) : '') + '-';
  if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
  if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

  return false;
}

function ruleMatchesRunOnly(def, runOnly) {
  const norm = normalizeRunOnly(runOnly);

  if (norm.includeRuleIds.length) {
    const ok = norm.includeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, ENGINE_TAG));
    if (!ok) return false;
  }

  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, ENGINE_TAG));
    if (blocked) return false;
  }

  if (norm.tags.length) {
    const tags = Array.isArray(def.tags) ? def.tags : [];
    const ok = tags.some((t) => norm.tags.includes(t));
    if (!ok) return false;
  }

  return true;
}

function getRulesCatalog() {
  return RULE_DEFS.map((r) => ({
    ruleId: r.ruleId,
    title: r.title,
    description: r.description,
    helpUrl: r.helpUrl,
    tags: Array.isArray(r.tags) ? r.tags.slice() : [],
    wcagSc: Array.isArray(r.wcagSc) ? r.wcagSc.slice() : [],
    defaultSeverity: r.defaultSeverity || 'moderate',
    defaultConfidence: r.defaultConfidence || 'medium',
    type: r.type || 'automatic',
    coverage: r.coverage || null
  }));
}

function getRulesForRunOnly(runOnly) {
  return RULE_DEFS
    .filter((r) => ruleMatchesRunOnly(r, runOnly))
    .map((r) => ({
      ruleId: r.ruleId,
      title: r.title,
      description: r.description,
      helpUrl: r.helpUrl,
      tags: Array.isArray(r.tags) ? r.tags.slice() : [],
      wcagSc: Array.isArray(r.wcagSc) ? r.wcagSc.slice() : [],
      defaultSeverity: r.defaultSeverity || 'moderate',
      defaultConfidence: r.defaultConfidence || 'medium',
      type: r.type || 'automatic',
      coverage: r.coverage || null
    }));
}

/**
 * Node/runtime runner.
 */
function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  const ctxSelector =
    (typeof contextSelector === 'string' && contextSelector.trim())
      ? contextSelector.trim()
      : null;

  const root =
    ctxSelector
      ? (document.querySelector(ctxSelector) ||
         document.documentElement ||
         document.body ||
         document.querySelector('html'))
      : (document.documentElement ||
         document.body ||
         document.querySelector('html'));

  const includeShadowDom = !!(engineOptions && engineOptions.includeShadowDom);

  ${normalizeSelectorListSource}

  const excludeSelectors = normalizeSelectorList(engineOptions && engineOptions.excludeSelectors);

  const url = pageUrl || (document.location && document.location.href) || null;
  const title = document.title || null;
  const timestamp = new Date().toISOString();

  function isExcluded(el) {
    if (!excludeSelectors.length || !el || !el.closest) return false;
    try {
      return excludeSelectors.some((sel) => !!el.closest(sel));
    } catch {
      return false;
    }
  }

  function queryAll(sel) {
    if (!root) return [];
    try {
      return Array.from(root.querySelectorAll(sel));
    } catch {
      return [];
    }
  }

  function queryAllDeep(sel) {
    if (!root) return [];
    const results = [];
    const seen = new Set();

    function pushAll(node) {
      if (!node || !node.querySelectorAll) return;
      let els = [];
      try {
        els = Array.from(node.querySelectorAll(sel));
      } catch {
        els = [];
      }
      for (const el of els) {
        if (el && !seen.has(el) && !isExcluded(el)) {
          seen.add(el);
          results.push(el);
        }
      }
    }

    function walk(node) {
      if (!node) return;
      if (node.nodeType === 1 && isExcluded(node)) return;

      pushAll(node);

      let all = [];
      try {
        all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
      } catch {
        all = [];
      }

      for (const el of all) {
        if (el && el.shadowRoot) walk(el.shadowRoot);
      }
    }

    walk(root);
    return results;
  }

  function queryAllSmart(sel) {
    const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
    return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
  }

  function getOuterHtmlSnippet(el) {
    if (!el || typeof el !== 'object') return '';
    try {
      const html = el.outerHTML || '';
      if (html.length > 2000) return html.slice(0, 2000) + '…';
      return html;
    } catch {
      return '';
    }
  }

  function buildSimpleSelector(el, fallbackTag) {
    try {
      if (!el || typeof el !== 'object') return fallbackTag || 'html';
      const tag = el.tagName ? el.tagName.toLowerCase() : (fallbackTag || 'html');
      const id = el.getAttribute && el.getAttribute('id');
      if (id && id.trim()) return tag + '#' + id.trim();
      const classes = (el.getAttribute && el.getAttribute('class')) || '';
      const cls = classes.split(/\\s+/).filter(Boolean);
      if (cls.length) return tag + '.' + cls[0];
      const name = el.getAttribute && el.getAttribute('name');
      if (name && name.trim()) return tag + '[name="' + name.trim() + '"]';
      return tag;
    } catch {
      return fallbackTag || 'html';
    }
  }

  function hasAccessibleName(el) {
    if (!el || typeof el !== 'object') return false;

    const ariaLabel = el.getAttribute && el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return true;

    const labelledby = el.getAttribute && el.getAttribute('aria-labelledby');
    if (labelledby && labelledby.trim()) {
      const ids = labelledby.trim().split(/\\s+/);
      for (const id of ids) {
        const ref = document.getElementById(id);
        if (ref && typeof ref.textContent === 'string' && ref.textContent.trim()) return true;
      }
    }

    const id = el.getAttribute && el.getAttribute('id');
    if (id && document.querySelector) {
      try {
        const escapedId = (window.CSS && window.CSS.escape) ? window.CSS.escape(id) : id;
        const explicitLabel = document.querySelector('label[for="' + escapedId + '"]');
        if (explicitLabel && explicitLabel.textContent && explicitLabel.textContent.trim()) return true;
      } catch {
        try {
          const explicitLabel = document.querySelector('label[for="' + id + '"]');
          if (explicitLabel && explicitLabel.textContent && explicitLabel.textContent.trim()) return true;
        } catch {}
      }
    }

    if (el.closest) {
      const wrapLabel = el.closest('label');
      if (wrapLabel && wrapLabel.textContent && wrapLabel.textContent.trim()) return true;
    }

    return false;
  }

  const sharedHelpers = {
    queryAll,
    queryAllDeep,
    queryAllSmart,
    getOuterHtmlSnippet,
    buildSimpleSelector,
    hasAccessibleName,
    isExcluded
  };

  const rulesResults = [];

  for (const def of RULE_DEFS) {
    if (!ruleMatchesRunOnly(def, runOnly)) continue;

    const impl = RULE_IMPLS[def.ruleId];
    if (typeof impl !== 'function') continue;

    const ruleConfig =
      engineOptions && engineOptions.rules && engineOptions.rules[def.ruleId]
        ? engineOptions.rules[def.ruleId]
        : null;

    const ctx = {
      document,
      window,
      root,
      rule: def,
      config: ruleConfig,
      helpers: sharedHelpers,
      engineTag: ENGINE_TAG,
      contextSelector: ctxSelector
    };

    let result;
    try {
      result = impl(ctx);
    } catch (err) {
      result = {
        ruleId: def.ruleId,
        outcome: 'cantTell',
        severity: def.defaultSeverity || 'moderate',
        occurrences: [],
        error: String(err && err.message ? err.message : err)
      };
    }

    if (!result || typeof result !== 'object') continue;
    rulesResults.push(normalizeRuleResult(def, result));
  }

  return {
    url,
    title,
    timestamp,
    contextSelector: ctxSelector,
    rules: rulesResults
  };
}

// =======================
// SELF-CONTAINED in-page runner for page.evaluate
// =======================
${inPageRunnerSource}

module.exports = {
  ENGINE_TAG,
  RULE_DEFS,
  getRuleDefById,
  getRulesCatalog,
  getRulesForRunOnly,
  runDomRulesInPage,
  runa11yCoreInPage
};
`;
}

function main() {
  const mods = loadRuleModules();
  const out = generateCore(mods);
  fs.writeFileSync(OUTPUT_FILE, out, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[build-core] wrote ${path.relative(ROOT_DIR, OUTPUT_FILE)} (${mods.length} rules)`);
}

main();
