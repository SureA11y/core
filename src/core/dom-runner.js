/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * DOM runner implementation.
 *
 * IMPORTANT:
 * - This function is inlined into generated core.js (Node + in-page runner).
 * - It intentionally references shared runtime helpers that core.js defines:
 *   resolvePolicy, POLICY_CONTRACTS, resolveRuleDefI18n, ruleMatchesRunOnly,
 *   normalizeRuleResult, normalizeLocale, resolveLocale, createDomHelpers, normalizeSelectorList,
 *   resolveContextRoots (src/core/dom-helpers.js -- also used by frame-scan.js),
 *   normalizeRuleMeta (src/core/rule-meta.js -- used for engineOptions.customRules).
 */

/* global resolvePolicy, POLICY_CONTRACTS, resolveRuleDefI18n, ruleMatchesRunOnly,
   normalizeRuleResult, normalizeLocale, resolveLocale, createDomHelpers, normalizeSelectorList,
   resolveContextRoots, normalizeRuleMeta */

/**
 * Rolls the atomic results up to one result per WCAG Success Criterion.
 *
 * Split out of runCore so a run assembled in pieces can reach it: a chunked
 * run only has every atomic result once its last chunk is done, and a
 * composite is meaningless over a subset of its own contributors.
 *
 * Reads nothing from the DOM -- given the same atomic results it returns the
 * same rollups.
 */
function rollupCompositeResults(
  checksResults,
  COMPOSITE_RULES,
  runOnly,
  engineOptionsResolved,
  policy,
  sharedHelpers,
  ENGINE_TAG,
  SCHEMA_VERSION
) {
  // =========================
  // Composite rule aggregation (data-only rollups)
  // =========================
  const rulesResults = [];
  try {
    const composites = Array.isArray(COMPOSITE_RULES) ? COMPOSITE_RULES : [];

    // Determine target conformance level from runOnly.tags (already normalized by caller)
    const LEVEL_RANK = { A: 1, AA: 2, AAA: 3 };

    function inferTargetLevelFromRunOnly(runOnly2) {
      const tags = runOnly2 && Array.isArray(runOnly2.tags) ? runOnly2.tags : [];
      // tags are already lowercase
      if (tags.includes('wcag2aaa') || tags.includes('wcag22aaa') || tags.includes('wcag21aaa'))
        return 'AAA';
      if (tags.includes('wcag2aa') || tags.includes('wcag22aa') || tags.includes('wcag21aa'))
        return 'AA';
      if (tags.includes('wcag2a') || tags.includes('wcag22a') || tags.includes('wcag21a'))
        return 'A';
      return null; // if not specified, don't filter composites (back-compat)
    }

    function normalizeLevel(s) {
      const v = typeof s === 'string' ? s.trim().toUpperCase() : '';
      return v === 'A' || v === 'AA' || v === 'AAA' ? v : null;
    }

    function isAllowedByTargetLevel(compositeLevel, targetLevel) {
      if (!targetLevel) return true;
      const c = LEVEL_RANK[compositeLevel];
      const t = LEVEL_RANK[targetLevel];
      if (!c || !t) return false; // unknown level => safest: exclude
      return c <= t;
    }

    const targetLevel = inferTargetLevelFromRunOnly(runOnly);

    // Severity rollup (deterministic)
    const SEVERITY_RANK = { minor: 1, moderate: 2, serious: 3, critical: 4 };

    function normalizeSeverity(s) {
      const v = typeof s === 'string' ? s.trim().toLowerCase() : '';
      return SEVERITY_RANK[v] ? v : null;
    }

    function maxSeverity(a, b) {
      if (!a) return b || null;
      if (!b) return a || null;
      return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
    }

    // Index atomic results by ruleId (deterministic)
    const byRuleId = Object.create(null);
    for (const rr of checksResults) {
      if (rr && typeof rr === 'object' && typeof rr.ruleId === 'string' && rr.ruleId) {
        byRuleId[rr.ruleId] = rr;
      }
    }

    function isNonEmptyString(s) {
      return typeof s === 'string' && !!s.trim();
    }

    function buildCompositeDef(entry) {
      if (!entry || typeof entry !== 'object') return null;

      const ruleId = isNonEmptyString(entry.id) ? entry.id.trim() : String(entry.id || '').trim();
      if (!ruleId) return null;

      const metaIn =
        entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
          ? entry.meta
          : {};

      const titleKey =
        typeof metaIn.titleKey === 'string' && metaIn.titleKey.trim() ? metaIn.titleKey.trim() : '';
      const descriptionKey =
        typeof metaIn.descriptionKey === 'string' && metaIn.descriptionKey.trim()
          ? metaIn.descriptionKey.trim()
          : '';

      const wcagSc = Array.isArray(metaIn.wcagSc)
        ? metaIn.wcagSc
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const tags = [];
      tags.push(String(ENGINE_TAG || 'a11ycore').toLowerCase());
      tags.push('composite');

      // Fixed WCAG-version-introduction lists (2.1 and 2.2 additions only -- every other
      // SC, including all pre-2.1 ones, is WCAG 2.0 baseline). Keep in sync with
      // src/coverage/wcag-version-map.js (the canonical copy the rule-authoring
      // consistency test checks against) -- this one has to stay a self-contained
      // literal since runCore is inlined via .toString() with no module access at runtime.
      const WCAG21_NEW_SCS = [
        '1.3.4',
        '1.3.5',
        '1.3.6',
        '1.4.10',
        '1.4.11',
        '1.4.12',
        '1.4.13',
        '2.1.4',
        '2.2.6',
        '2.3.3',
        '2.5.1',
        '2.5.2',
        '2.5.3',
        '2.5.4',
        '2.5.5',
        '2.5.6',
        '4.1.3'
      ];
      const WCAG22_NEW_SCS = [
        '2.4.11',
        '2.4.12',
        '2.4.13',
        '2.5.7',
        '2.5.8',
        '3.2.6',
        '3.3.7',
        '3.3.8',
        '3.3.9'
      ];
      const isWcag22Sc = wcagSc.some((sc) => WCAG22_NEW_SCS.includes(sc));
      const isWcag21Sc = !isWcag22Sc && wcagSc.some((sc) => WCAG21_NEW_SCS.includes(sc));
      const versionTagPrefix = isWcag22Sc ? 'wcag22' : isWcag21Sc ? 'wcag21' : 'wcag2';

      const lvl = typeof metaIn.level === 'string' ? metaIn.level.trim().toUpperCase() : '';
      if (lvl === 'A') {
        tags.push(versionTagPrefix + 'a');
      } else if (lvl === 'AA') {
        tags.push(versionTagPrefix + 'a', versionTagPrefix + 'aa');
      } else if (lvl === 'AAA') {
        tags.push(versionTagPrefix + 'a', versionTagPrefix + 'aa', versionTagPrefix + 'aaa');
      }

      // Build normativeMappings so downstream consumers (like adapters) can derive WCAG SC/level
      const normativeMappingsFromMeta = wcagSc.map((sc) => {
        const m = { standard: 'WCAG', requirement: sc };
        if (lvl === 'A' || lvl === 'AA' || lvl === 'AAA') m.level = lvl;
        return m;
      });

      const checksIds = Array.isArray(entry.checksIds)
        ? entry.checksIds
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        ruleId,
        title: metaIn.title || ruleId,
        description: metaIn.description || '',

        i18n:
          titleKey || descriptionKey
            ? { titleKey: titleKey || '', descriptionKey: descriptionKey || '' }
            : null,

        helpUrl: '',
        tags,

        normativeMappings: normativeMappingsFromMeta,

        defaultSeverity: 'serious',
        defaultConfidence: 'medium',
        type: 'automatic',
        coverage: null,

        ruleInterfaceVersion: '1.0.0',
        ruleVersion: '0.0.0',
        normative: true,
        atomic: false,
        deprecated: false,
        deprecation: null,
        category: null,
        standard: null,
        applicability: '',
        expectation: '',
        references: [],
        requirements: null,
        mappings: null,

        // optional catalog meta passthrough
        data: {
          details: {
            kind: 'compositeRule',
            wcagSc,
            level:
              typeof metaIn.level === 'string' && metaIn.level.trim() ? metaIn.level.trim() : null
          }
        },

        __checksIds: checksIds
      };
    }

    for (let i = 0; i < composites.length; i++) {
      const entry = composites[i];
      const cDef0 = buildCompositeDef(entry);
      if (!cDef0) continue;

      // Conformance-level gate: if scan is AA, suppress AAA composites even if tags match
      const compositeLevel =
        cDef0 && cDef0.data && cDef0.data.details && normalizeLevel(cDef0.data.details.level);

      if (!isAllowedByTargetLevel(compositeLevel, targetLevel)) continue;

      // Localize title/description (uses def.i18n.* keys)
      const cDefResolved = resolveRuleDefI18n(cDef0, engineOptionsResolved);

      // Apply same selection logic to composites
      if (!ruleMatchesRunOnly(cDefResolved, runOnly, ENGINE_TAG)) continue;

      const checksIds = Array.isArray(cDef0.__checksIds) ? cDef0.__checksIds : [];

      // rollup metrics (stable order)
      let failCount = 0;
      let cantTellCount = 0;
      let notApplicableCount = 0;
      let passCount = 0;
      let missingCount = 0;

      const contributors = [];

      let rolledFailSeverity = null; // max severity among FAIL contributors
      let rolledCantTellSeverity = null; // max severity among CANTTELL contributors (optional)

      for (let j = 0; j < checksIds.length; j++) {
        const tid = checksIds[j];
        const child = tid ? byRuleId[tid] : null;

        if (!child) {
          missingCount += 1;
          contributors.push({ testId: tid, outcome: 'missing' });
          continue;
        }

        const out = child.outcome;
        const childSev = normalizeSeverity(child && child.severity);

        contributors.push({ testId: tid, outcome: out, severity: childSev || null });

        if (out === 'fail' && childSev) {
          rolledFailSeverity = maxSeverity(rolledFailSeverity, childSev);
        } else if (out === 'cantTell' && childSev) {
          rolledCantTellSeverity = maxSeverity(rolledCantTellSeverity, childSev);
        }

        if (out === 'fail') failCount += 1;
        else if (out === 'cantTell') cantTellCount += 1;
        else if (out === 'notApplicable') notApplicableCount += 1;
        else if (out === 'pass') passCount += 1;
      }

      // outcome precedence:
      // fail if any fail
      // cantTell if any cantTell OR missing and none fail
      // notApplicable if all notApplicable (and there is at least one test)
      // pass otherwise
      let outcome = 'pass';
      let reasonCode = 'composite.rollup.pass.otherwise';

      if (failCount > 0) {
        outcome = 'fail';
        reasonCode = 'composite.rollup.fail.anyFail';
      } else if (cantTellCount > 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.anyCantTell';
      } else if (missingCount > 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.missingChild';
      } else if (checksIds.length > 0 && notApplicableCount === checksIds.length) {
        outcome = 'notApplicable';
        reasonCode = 'composite.rollup.notApplicable.allInapplicable';
      } else if (checksIds.length === 0) {
        outcome = 'cantTell';
        reasonCode = 'composite.rollup.cantTell.emptyComposite';
      }

      const raw = {
        outcome,
        occurrences: [],

        // REQUIRED by your reporting schema (top-level)
        summaryKey: 'Composite rule rollup',
        i18nKey: 'composite_rollup_summary',
        i18nParams: { reasonCode, testCount: String(checksIds.length) },

        // REQUIRED by your reporting schema (machine-readable payload)
        data: {
          details: {
            reasonCode,
            checksIds: checksIds.slice(),
            contributors,
            metrics: {
              failCount,
              cantTellCount,
              notApplicableCount,
              passCount,
              missingCount
            }
          }
        },

        engineOptions: {
          ...(engineOptionsResolved || {}),
          locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
        }
      };

      // Promote composite severity based on contributors (deterministic).
      // - If composite fails: use max severity among failing children.
      // - If composite cantTell: use max severity among cantTell children (fallback to failing if you prefer).
      if (outcome === 'fail' && rolledFailSeverity) {
        raw.severity = rolledFailSeverity;
      } else if (outcome === 'cantTell' && rolledCantTellSeverity) {
        raw.severity = rolledCantTellSeverity;
      }

      rulesResults.push(
        normalizeRuleResult(cDefResolved, raw, SCHEMA_VERSION, policy, sharedHelpers)
      );
    }
  } catch (e) {
    // no-throws: omit rulesResults if anything goes wrong
  }

  return rulesResults;
}

function runCore(
  pageUrl,
  contextSelector,
  engineOptions,
  runOnly,
  CHECK_DEFS,
  RULE_IMPLS,
  ENGINE_TAG,
  SCHEMA_VERSION,
  COMPOSITE_RULES
) {
  // Normalize contrast options without mutating caller-provided engineOptions.
  function __normalizeContrastOptions(engineOptions2) {
    const eo = engineOptions2 && typeof engineOptions2 === 'object' ? engineOptions2 : {};
    const c = eo.contrast && typeof eo.contrast === 'object' ? eo.contrast : {};
    const mode = c.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
    const rootCanvasFallback =
      typeof c.rootCanvasFallback === 'string' && c.rootCanvasFallback.trim()
        ? c.rootCanvasFallback.trim()
        : '#ffffff';
    return { mode, rootCanvasFallback };
  }

  const engineOptionsResolved =
    engineOptions && typeof engineOptions === 'object'
      ? { ...engineOptions, contrast: __normalizeContrastOptions(engineOptions) }
      : { contrast: __normalizeContrastOptions(null) };

  const policy = resolvePolicy(POLICY_CONTRACTS, engineOptionsResolved);

  // contextSelector accepts a single selector string (which may itself be a
  // comma-separated selector list -- ordinary CSS union semantics) OR an
  // array of selector strings for scanning multiple, possibly disjoint
  // regions in one run. Both forms resolve via querySelectorAll, not
  // querySelector, so "matches this selector" means all matches, not just
  // the first. Shared with frame-scan.js (same resolution used to discover
  // which child <iframe>/<frame> elements fall within the same scan scope).
  const { ctxSelector, roots } = resolveContextRoots(document, contextSelector);

  // Default on: opt OUT with `includeShadowDom: false`, not opt in.
  const includeShadowDom = !(
    engineOptionsResolved && engineOptionsResolved.includeShadowDom === false
  );
  // Default off: hidden/collapsed content is excluded from rule evaluation
  // unless the caller explicitly opts in.
  const includeHiddenElements = !!(
    engineOptionsResolved && engineOptionsResolved.includeHiddenElements === true
  );
  const excludeSelectors = normalizeSelectorList(
    engineOptionsResolved && engineOptionsResolved.excludeSelectors
  );
  // Default off: explicit opt-in for "this scan target was never meant to
  // represent a real page" -- see helpers.isWholeDocumentScope().
  const fragment = !!(engineOptionsResolved && engineOptionsResolved.fragment === true);

  const url = pageUrl || (document.location && document.location.href) || null;
  const title = document.title || null;
  // Deterministic timestamp: only use host-provided value (no time-based logic).
  const timestamp =
    engineOptionsResolved &&
    typeof engineOptionsResolved.timestamp === 'string' &&
    engineOptionsResolved.timestamp.trim()
      ? engineOptionsResolved.timestamp.trim()
      : null;

  // createDomHelpers()/createContrastHelpers() persist their element-keyed
  // caches (outerHtmlCache, selectorCache, etc.) on window.__a11ycoreSharedCache
  // so multiple helper instances created *within this run* can share them
  // deterministically. But a window/document is frequently reused across
  // SEPARATE runs -- e.g. Jest's jsdom environment creates one window per
  // test file, and mutating document.body between it() blocks is standard.
  // Those caches are keyed by element reference, not content, so a run that
  // reuses an already-cached element (document.body never changes identity)
  // would otherwise read stale data cached by an earlier, unrelated run on
  // the same window. Clearing at the start of every run keeps sharing scoped
  // to "this run" as intended, without leaking across runs.
  try {
    if (window && window.__a11ycoreSharedCache) window.__a11ycoreSharedCache = {};
  } catch {}

  const sharedHelpers = createDomHelpers({
    document,
    window,
    root: roots,
    includeShadowDom,
    includeHiddenElements,
    excludeSelectors,
    fragment,
    // Optional perf counters (bench/debug only). Deterministic and per-run.
    perfStats: !!(engineOptionsResolved && engineOptionsResolved.perfStats)
  });

  const profileRules = !!(engineOptionsResolved && engineOptionsResolved.profileRules);
  const ruleTimings = profileRules ? Object.create(null) : null;

  function nowMs() {
    // performance.now() if available, else Date.now()
    try {
      if (
        typeof performance !== 'undefined' &&
        performance &&
        typeof performance.now === 'function'
      ) {
        return performance.now();
      }
    } catch (e) {}
    return Date.now();
  }

  // =========================
  // Probes (optional evidence fed by the host app)
  // Keep deterministic + serializable + no-throws.
  // =========================
  function sanitizeProbeValue(v, depth) {
    // depth-bounded, JSON-safe sanitizer
    if (depth <= 0) return null;
    if (v == null) return null;

    const t = typeof v;
    if (t === 'string') return v.length > 2000 ? v.slice(0, 2000) : v;
    if (t === 'number') return Number.isFinite(v) ? v : null;
    if (t === 'boolean') return v;
    if (t === 'function') return null;

    if (Array.isArray(v)) {
      // cap arrays to avoid huge payloads
      const out = [];
      const n = Math.min(v.length, 200);
      for (let i = 0; i < n; i++) out.push(sanitizeProbeValue(v[i], depth - 1));
      return out;
    }

    if (t === 'object') {
      const out = {};
      const keys = Object.keys(v).sort();
      // cap object keys
      const n = Math.min(keys.length, 50);
      for (let i = 0; i < n; i++) {
        const k = keys[i];
        // only allow string keys
        if (typeof k !== 'string') continue;
        out[k] = sanitizeProbeValue(v[k], depth - 1);
      }
      return out;
    }

    return null;
  }

  let probes;
  try {
    const rawProbes =
      engineOptionsResolved && typeof engineOptionsResolved.probes === 'object'
        ? engineOptionsResolved.probes
        : null;
    probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
    if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
  } catch (e) {
    probes = null;
  }

  // =========================
  // Runtime custom rules (engineOptions.customRules)
  // =========================
  // Same module shape as an internal rule file: { id, meta, runInPage, applicability?, data? }.
  // runInPage/applicability may be a real function (fine for same-realm/Node/jsdom callers)
  // or a function-source string (required for cross-realm callers, e.g. a Playwright
  // page.evaluate(runa11yCoreInPage, { engineOptions }) call -- engineOptions crosses a
  // structured-clone/JSON boundary there, so a live Function reference can't survive it,
  // but a string can). Reconstructed via `new Function`, matching exactly how build-core.js
  // already embeds each built-in rule's own runInPage source into the in-page runner.
  // Scan-scoped only (not added to the static CHECK_DEFS/getRulesCatalog()
  // catalog) -- matches surea11y's "fresh engineOptions per call, no
  // mutable global config" design (see ROADMAP.md).
  let effectiveCheckDefs = CHECK_DEFS;
  let effectiveRuleImpls = RULE_IMPLS;
  let overriddenBuiltinIds = [];
  const rawCustomRules = Array.isArray(engineOptionsResolved.customRules)
    ? engineOptionsResolved.customRules
    : [];
  if (rawCustomRules.length) {
    function reviveRuleFn(value) {
      if (typeof value === 'function') return value;
      if (typeof value === 'string' && value.trim()) {
        try {
          const fn = new Function('return (' + value + ')')();
          if (typeof fn === 'function') return fn;
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    const extraDefsById = new Map();
    const extraImpls = {};
    for (const c of rawCustomRules) {
      if (!c || typeof c !== 'object') continue;
      const ruleId = typeof c.id === 'string' ? c.id.trim() : '';
      if (!ruleId) continue;
      const runFn = reviveRuleFn(c.runInPage);
      if (typeof runFn !== 'function') continue; // invalid custom rule: skipped, not a crash

      const applicabilityFn = reviveRuleFn(c.applicability);
      const normalizedMeta = normalizeRuleMeta(ruleId, ruleId, c.meta, ENGINE_TAG);

      // Overriding a built-in rule id is supported (see docs/ENGINE_OPTIONS.md),
      // but a same-named custom rule is just as likely to be an accidental
      // collision (a generic name like "region" or "tabindex" picked without
      // realizing it's already a built-in id) as a deliberate override -- so
      // surface it either way rather than silently swapping the rule out.
      if (CHECK_DEFS.some((d) => d && d.ruleId === ruleId)) {
        overriddenBuiltinIds.push(ruleId);
      }

      extraDefsById.set(ruleId, {
        ruleId,
        title: normalizedMeta.title,
        description: normalizedMeta.description,
        i18n: normalizedMeta.i18n,
        helpUrl: normalizedMeta.helpUrl,
        tags: normalizedMeta.tags,
        wcagSc: normalizedMeta.wcagSc,
        normativeMappings: normalizedMeta.normativeMappings,
        defaultSeverity: normalizedMeta.defaultSeverity,
        defaultConfidence: normalizedMeta.defaultConfidence,
        type: normalizedMeta.type,
        coverage: normalizedMeta.coverage,
        data: c.data === undefined ? null : c.data,
        ruleInterfaceVersion: normalizedMeta.ruleInterfaceVersion,
        ruleVersion: normalizedMeta.ruleVersion,
        normative: normalizedMeta.normative,
        atomic: normalizedMeta.atomic,
        deprecated: normalizedMeta.deprecated,
        deprecation: normalizedMeta.deprecation,
        category: normalizedMeta.category,
        standard: normalizedMeta.standard,
        applicability: normalizedMeta.applicability,
        expectation: normalizedMeta.expectation,
        references: normalizedMeta.references,
        requirements: normalizedMeta.requirements,
        mappings: normalizedMeta.mappings
      });
      extraImpls[ruleId] = { run: runFn, applicability: applicabilityFn || null };
    }

    if (extraDefsById.size) {
      effectiveCheckDefs = CHECK_DEFS.filter((d) => !extraDefsById.has(d.ruleId)).concat(
        Array.from(extraDefsById.values())
      );
      effectiveRuleImpls = { ...RULE_IMPLS, ...extraImpls };
    }

    if (overriddenBuiltinIds.length) {
      try {
        console.warn(
          '[surea11y] customRules overriding built-in rule id(s) for this scan: ' +
            overriddenBuiltinIds.join(', ')
        );
      } catch (e) {}
    }
  }

  // =========================
  // WCAG version scoping
  // =========================
  // Every WCAG version so far is additive except for one criterion: 4.1.1
  // Parsing, which 2.2 removed. A rule mapped only to a removed criterion
  // still reports something real -- a duplicate id breaks `<label for>`,
  // fragment links and getElementById whatever the standard says -- but it
  // cannot be a conformance FAILURE under a target version that no longer
  // contains the criterion. So the rule keeps running and its fail is
  // coerced to cantTell there: the finding stays visible for human review
  // instead of gating a 2.2 run, and nobody has to remember to exclude it.
  //
  // Resolution order: an explicit engineOptions.wcagVersion, then whatever
  // the caller's own version tag set implies (the ready-made sets in
  // docs/ENGINE_OPTIONS.md), then this engine's default target of 2.2.
  const WCAG_REMOVED_SC_TAG = 'wcag22-removed';
  const DEFAULT_WCAG_VERSION = '2.2';

  function normalizeWcagVersion(v) {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '2.0' || s === '2.1' || s === '2.2' ? s : null;
  }

  // Only the nine version-origin tags carry version intent. An SC tag
  // (`wcag411`), a level tag on its own or `best-practice` says nothing
  // about which version the caller is conformance-testing against, so a
  // run filtered by those falls through to the default.
  function inferWcagVersionFromRunOnly(runOnly2) {
    const tags = runOnly2 && Array.isArray(runOnly2.tags) ? runOnly2.tags : [];
    if (!tags.length) return null;
    if (tags.includes('wcag22a') || tags.includes('wcag22aa') || tags.includes('wcag22aaa'))
      return '2.2';
    if (tags.includes('wcag21a') || tags.includes('wcag21aa') || tags.includes('wcag21aaa'))
      return '2.1';
    if (tags.includes('wcag2a') || tags.includes('wcag2aa') || tags.includes('wcag2aaa'))
      return '2.0';
    return null;
  }

  const targetWcagVersion =
    normalizeWcagVersion(engineOptionsResolved && engineOptionsResolved.wcagVersion) ||
    inferWcagVersionFromRunOnly(runOnly) ||
    DEFAULT_WCAG_VERSION;

  function scopeOutcomeToWcagVersion(def, result) {
    if (targetWcagVersion !== '2.2') return result;
    if (!result || typeof result !== 'object' || result.outcome !== 'fail') return result;

    const defTags = def && Array.isArray(def.tags) ? def.tags : [];
    if (!defTags.some((tag) => String(tag).toLowerCase() === WCAG_REMOVED_SC_TAG)) return result;

    const removedSc = def && Array.isArray(def.wcagSc) ? def.wcagSc.slice() : [];

    // Every occurrence becomes cantTell-tier here, so each one states why: the
    // finding stands, the criterion it was made against does not.
    const occurrences = Array.isArray(result.occurrences)
      ? result.occurrences.map((occ) => {
          if (!occ || typeof occ !== 'object' || Array.isArray(occ)) return occ;
          const next =
            occ.occurrenceOutcome === 'fail'
              ? { ...occ, occurrenceOutcome: 'cantTell' }
              : { ...occ };
          if (!next.uncertainty) {
            next.uncertainty = {
              code: 'out-of-scope',
              needed: `Whether this still matters under WCAG ${targetWcagVersion}, which removed the criterion it was found against.`,
              evidence: { removedSc, target: targetWcagVersion, findingStands: true }
            };
          }
          return next;
        })
      : result.occurrences;

    // Deliberately NOT reported through `error`: nothing went wrong here,
    // and consumers read a non-empty `error` as "this rule threw".
    return {
      ...result,
      outcome: 'cantTell',
      occurrences,
      wcagVersionScope: {
        target: targetWcagVersion,
        removedSc,
        coercedFrom: 'fail'
      }
    };
  }

  const checksResults = [];

  for (const def of effectiveCheckDefs) {
    const t0 = ruleTimings ? nowMs() : 0;
    const defResolved = resolveRuleDefI18n(def, engineOptionsResolved);
    if (!ruleMatchesRunOnly(defResolved, runOnly, ENGINE_TAG)) continue;

    const implEntry = effectiveRuleImpls[defResolved.ruleId];
    const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
    const applicabilityFn =
      implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
    if (typeof impl !== 'function') continue;

    const ruleConfig =
      engineOptionsResolved &&
      engineOptionsResolved.rules &&
      engineOptionsResolved.rules[defResolved.ruleId]
        ? engineOptionsResolved.rules[defResolved.ruleId]
        : null;

    // Rule-scoped excludeSelectors (engineOptions.rules[ruleId].excludeSelectors)
    // apply on top of the global excludeSelectors for exactly this rule's
    // applicability check + run, then are cleared once this rule is done.
    // Safe because rule execution below is synchronous and one rule at a
    // time -- sharedHelpers is reused across all rules in this loop.
    if (typeof sharedHelpers.__setActiveRuleExcludeSelectors === 'function') {
      sharedHelpers.__setActiveRuleExcludeSelectors(ruleConfig && ruleConfig.excludeSelectors);
    }

    const ctx = {
      document,
      window,
      root: roots,
      rule: defResolved,
      config: ruleConfig,
      helpers: sharedHelpers,
      engineTag: ENGINE_TAG,
      contextSelector: ctxSelector,
      engineOptions:
        engineOptionsResolved && typeof engineOptionsResolved === 'object'
          ? engineOptionsResolved
          : {},

      // Optional evidence channel provided by host app
      inputs: {
        probes
      }
    };

    if (typeof applicabilityFn === 'function') {
      let applicable = true;
      try {
        const res = applicabilityFn(ctx);
        if (typeof res === 'boolean') applicable = res;
        else if (res && typeof res === 'object' && typeof res.applicable === 'boolean')
          applicable = res.applicable;
      } catch (err) {
        const raw = {
          outcome: 'cantTell',
          occurrences: [],
          error: String(err && err.message ? err.message : err),
          engineOptions: {
            ...(ctx.engineOptions || {}),
            locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
          }
        };
        checksResults.push(
          normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers)
        );
        if (ruleTimings)
          ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
        continue;
      }

      if (!applicable) {
        const raw = {
          outcome: 'notApplicable',
          occurrences: [],
          engineOptions: {
            ...(ctx.engineOptions || {}),
            locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
          }
        };
        checksResults.push(
          normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers)
        );
        if (ruleTimings)
          ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
        continue;
      }
    }

    let result;
    try {
      result = impl(ctx);
    } catch (err) {
      result = {
        outcome: 'cantTell',
        occurrences: [],
        error: String(err && err.message ? err.message : err),
        engineOptions: {
          ...(ctx.engineOptions || {}),
          locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
        }
      };
    }

    if (!result || typeof result !== 'object') {
      if (ruleTimings)
        ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
      continue;
    }
    if (!result.engineOptions) {
      result.engineOptions = {
        ...(ctx.engineOptions || {}),
        locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale)
      };
    }
    checksResults.push(
      normalizeRuleResult(
        defResolved,
        scopeOutcomeToWcagVersion(defResolved, result),
        SCHEMA_VERSION,
        policy,
        sharedHelpers
      )
    );
    if (ruleTimings)
      ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
  }

  // Composite rollups below carry no occurrences/nodes of their own, so
  // they never exercise rule-scoped excludes -- but clear the "active
  // rule" state on sharedHelpers regardless, so nothing after this point
  // (composite aggregation, perf stats) can observe a stale rule's excludes.
  if (typeof sharedHelpers.__setActiveRuleExcludeSelectors === 'function') {
    sharedHelpers.__setActiveRuleExcludeSelectors(null);
  }

  const rulesResults = rollupCompositeResults(
    checksResults,
    COMPOSITE_RULES,
    runOnly,
    engineOptionsResolved,
    policy,
    sharedHelpers,
    ENGINE_TAG,
    SCHEMA_VERSION
  );

  // Optional perf counters passthrough (only when enabled). Deterministic.
  let perfStats = null;
  try {
    if (
      engineOptionsResolved &&
      engineOptionsResolved.perfStats &&
      sharedHelpers &&
      typeof sharedHelpers.getPerfStats === 'function'
    ) {
      perfStats = sharedHelpers.getPerfStats();
    }
  } catch (e) {
    perfStats = null;
  }

  if (ruleTimings) {
    if (perfStats && engineOptionsResolved && engineOptionsResolved.profileRules) {
      perfStats.ruleTimings = ruleTimings; // (whatever your timing map is)
    }
  }

  return {
    engine: {
      tag: ENGINE_TAG,
      schemaVersion: SCHEMA_VERSION,
      locale: resolveLocale(engineOptionsResolved),
      wcagVersion: targetWcagVersion
    },
    url,
    title,
    timestamp,
    perfStats,
    contextSelector: ctxSelector,
    checksResults,
    rulesResults,
    overriddenBuiltinIds
  };
}

module.exports = { runCore, rollupCompositeResults };
