'use strict';

/**
 * DOM runner implementation.
 *
 * IMPORTANT:
 * - This function is inlined into generated core.js (Node + in-page runner).
 * - It intentionally references shared runtime helpers that core.js defines:
 *   resolvePolicy, POLICY_CONTRACTS, resolveRuleDefI18n, ruleMatchesRunOnly,
 *   normalizeRuleResult, normalizeLocale, createDomHelpers, normalizeSelectorList.
 */

function runCore(pageUrl, contextSelector, engineOptions, runOnly, CHECK_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION, COMPOSITE_RULES) {
    const ctxSelector =
        (typeof contextSelector === 'string' && contextSelector.trim())
            ? contextSelector.trim()
            : null;

    // Normalize contrast options without mutating caller-provided engineOptions.
    function __normalizeContrastOptions(engineOptions2) {
        const eo = engineOptions2 && typeof engineOptions2 === 'object' ? engineOptions2 : {};
        const c = (eo.contrast && typeof eo.contrast === 'object') ? eo.contrast : {};
        const mode = (c.mode === 'auditorAssist') ? 'auditorAssist' : 'strictConformance';
        const rootCanvasFallback =
            (typeof c.rootCanvasFallback === 'string' && c.rootCanvasFallback.trim())
                ? c.rootCanvasFallback.trim()
                : '#ffffff';
        return { mode, rootCanvasFallback };
    }

    const engineOptionsResolved =
        (engineOptions && typeof engineOptions === 'object')
            ? { ...engineOptions, contrast: __normalizeContrastOptions(engineOptions) }
            : { contrast: __normalizeContrastOptions(null) };

    const policy = resolvePolicy(POLICY_CONTRACTS, engineOptionsResolved);

    const root =
        ctxSelector
            ? (document.querySelector(ctxSelector) ||
                document.documentElement ||
                document.body ||
                document.querySelector('html'))
            : (document.documentElement ||
                document.body ||
                document.querySelector('html'));


    const includeShadowDom = !!(engineOptionsResolved && engineOptionsResolved.includeShadowDom);
    const excludeSelectors = normalizeSelectorList(engineOptionsResolved && engineOptionsResolved.excludeSelectors);

    const url = pageUrl || (document.location && document.location.href) || null;
    const title = document.title || null;
    // Deterministic timestamp: only use host-provided value (no time-based logic).
    const timestamp =
        (engineOptionsResolved && typeof engineOptionsResolved.timestamp === 'string' && engineOptionsResolved.timestamp.trim())
            ? engineOptionsResolved.timestamp.trim()
            : null;

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors,
        // Optional perf counters (bench/debug only). Deterministic and per-run.
        perfStats: !!(engineOptionsResolved && engineOptionsResolved.perfStats)
    });

    const profileRules = !!(engineOptionsResolved && engineOptionsResolved.profileRules);
    const ruleTimings = profileRules ? Object.create(null) : null;

    function nowMs() {
        // performance.now() if available, else Date.now()
        try {
            if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
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

    let probes = null;
    try {
        const rawProbes = engineOptionsResolved && typeof engineOptionsResolved.probes === 'object' ? engineOptionsResolved.probes : null;
        probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
        if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
    } catch (e) {
        probes = null;
    }

    const checksResults = [];

    for (const def of CHECK_DEFS) {
        const t0 = ruleTimings ? nowMs() : 0;
        const defResolved = resolveRuleDefI18n(def, engineOptionsResolved);
        if (!ruleMatchesRunOnly(defResolved, runOnly, ENGINE_TAG)) continue;

        const implEntry = RULE_IMPLS[defResolved.ruleId];
        const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
        const applicabilityFn = implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
        if (typeof impl !== 'function') continue;

        const ruleConfig =
            engineOptionsResolved && engineOptionsResolved.rules && engineOptionsResolved.rules[defResolved.ruleId]
                ? engineOptionsResolved.rules[defResolved.ruleId]
                : null;

        const ctx = {
            document,
            window,
            root,
            rule: defResolved,
            config: ruleConfig,
            helpers: sharedHelpers,
            engineTag: ENGINE_TAG,
            contextSelector: ctxSelector,
            engineOptions: (engineOptionsResolved && typeof engineOptionsResolved === 'object') ? engineOptionsResolved : {},

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
                else if (res && typeof res === 'object' && typeof res.applicable === 'boolean') applicable = res.applicable;
            } catch (err) {
                const raw = {
                    outcome: 'cantTell',
                    occurrences: [],
                    error: String(err && err.message ? err.message : err),
                    engineOptions: { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale) }
                };
                checksResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale) }
                };
                checksResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
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
                engineOptions: { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale) }
            };
        }

        if (!result || typeof result !== 'object') {
            if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
            continue;
        }
        if (!result.engineOptions) {
            result.engineOptions = { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptionsResolved && engineOptionsResolved.locale) };
        }
        checksResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy, sharedHelpers));
        if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
    }

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
            if (tags.includes('wcag2aaa') || tags.includes('wcag22aaa') || tags.includes('wcag21aaa')) return 'AAA';
            if (tags.includes('wcag2aa') || tags.includes('wcag22aa') || tags.includes('wcag21aa')) return 'AA';
            if (tags.includes('wcag2a') || tags.includes('wcag22a') || tags.includes('wcag21a')) return 'A';
            return null; // if not specified, don't filter composites (back-compat)
        }

        function normalizeLevel(s) {
            const v = typeof s === 'string' ? s.trim().toUpperCase() : '';
            return (v === 'A' || v === 'AA' || v === 'AAA') ? v : null;
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
            return (SEVERITY_RANK[b] > SEVERITY_RANK[a]) ? b : a;
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

            const metaIn = (entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)) ? entry.meta : {};

            const titleKey = (typeof metaIn.titleKey === 'string' && metaIn.titleKey.trim()) ? metaIn.titleKey.trim() : '';
            const descriptionKey = (typeof metaIn.descriptionKey === 'string' && metaIn.descriptionKey.trim()) ? metaIn.descriptionKey.trim() : '';

            const tags = [];
            tags.push(String(ENGINE_TAG || 'a11ycore').toLowerCase());
            tags.push('composite');

            const lvl = (typeof metaIn.level === 'string' ? metaIn.level.trim().toUpperCase() : '');
            if (lvl === 'A') {
                tags.push('wcag2a', 'wcag21a');
            } else if (lvl === 'AA') {
                tags.push('wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa');
            } else if (lvl === 'AAA') {
                tags.push('wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa');
            }

            const wcagSc = Array.isArray(metaIn.wcagSc) ? metaIn.wcagSc.map(String).map(s => s.trim()).filter(Boolean) : [];
            // Build normativeMappings so downstream consumers (like adapters) can derive WCAG SC/level
            const normativeMappingsFromMeta = wcagSc.map((sc) => {
                const m = { standard: 'WCAG', requirement: sc };
                if (lvl === 'A' || lvl === 'AA' || lvl === 'AAA') m.level = lvl;
                return m;
            });

            const checksIds =
                Array.isArray(entry.checksIds)
                    ? entry.checksIds.map(String).map(s => s.trim()).filter(Boolean)
                    : [];

            return {
                ruleId,
                title: metaIn.title || ruleId,
                description: metaIn.description || '',

                i18n: (titleKey || descriptionKey) ? { titleKey: titleKey || '', descriptionKey: descriptionKey || '' } : null,

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
                        level: (typeof metaIn.level === 'string' && metaIn.level.trim()) ? metaIn.level.trim() : null
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
                cDef0 &&
                cDef0.data &&
                cDef0.data.details &&
                normalizeLevel(cDef0.data.details.level);

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

            let rolledFailSeverity = null;     // max severity among FAIL contributors
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
                i18nKey: 'a11ycore_composite_rollup_summary',
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

            rulesResults.push(normalizeRuleResult(cDefResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
        }
    } catch (e) {
        // no-throws: omit rulesResults if anything goes wrong
    }

    // Optional perf counters passthrough (only when enabled). Deterministic.
    let perfStats = null;
    try {
        if (engineOptionsResolved && engineOptionsResolved.perfStats && sharedHelpers && typeof sharedHelpers.getPerfStats === 'function') {
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
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
        perfStats,
        contextSelector: ctxSelector,
        checksResults,
        rulesResults
    };
}

module.exports = { runCore };
