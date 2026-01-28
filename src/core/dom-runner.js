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

function runCore(pageUrl, contextSelector, engineOptions, runOnly, RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION) {
    const ctxSelector =
        (typeof contextSelector === 'string' && contextSelector.trim())
            ? contextSelector.trim()
            : null;

    const policy = resolvePolicy(POLICY_CONTRACTS, engineOptions);

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
    const excludeSelectors = normalizeSelectorList(engineOptions && engineOptions.excludeSelectors);

    const url = pageUrl || (document.location && document.location.href) || null;
    const title = document.title || null;
    // Deterministic timestamp: only use host-provided value (no time-based logic).
    const timestamp =
        (engineOptions && typeof engineOptions.timestamp === 'string' && engineOptions.timestamp.trim())
            ? engineOptions.timestamp.trim()
            : null;

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors,
        // Optional perf counters (bench/debug only). Deterministic and per-run.
        perfStats: !!(engineOptions && engineOptions.perfStats)
    });

    const profileRules = !!(engineOptions && engineOptions.profileRules);
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
            const keys = Object.keys(v);
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
        const rawProbes = engineOptions && typeof engineOptions.probes === 'object' ? engineOptions.probes : null;
        probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
        if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
    } catch (e) {
        probes = null;
    }

    const rulesResults = [];

    for (const def of RULE_DEFS) {
        const t0 = ruleTimings ? nowMs() : 0;
        const defResolved = resolveRuleDefI18n(def, engineOptions);
        if (!ruleMatchesRunOnly(defResolved, runOnly)) continue;

        const implEntry = RULE_IMPLS[defResolved.ruleId];
        const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
        const applicabilityFn = implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
        if (typeof impl !== 'function') continue;

        const ruleConfig =
            engineOptions && engineOptions.rules && engineOptions.rules[defResolved.ruleId]
                ? engineOptions.rules[defResolved.ruleId]
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
            engineOptions: (engineOptions && typeof engineOptions === 'object') ? engineOptions : {},

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
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
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
                engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
            };
        }

        if (!result || typeof result !== 'object') {
            if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
            continue;
        }
        if (!result.engineOptions) {
            result.engineOptions = { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy, sharedHelpers));
        if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
    }


    // Optional perf counters passthrough (only when enabled). Deterministic.
    let perfStats = null;
    try {
        if (engineOptions && engineOptions.perfStats && sharedHelpers && typeof sharedHelpers.getPerfStats === 'function') {
            perfStats = sharedHelpers.getPerfStats();
        }
    } catch (e) {
        perfStats = null;
    }

    if (ruleTimings) {
        if (perfStats && engineOptions && engineOptions.profileRules) {
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
        rules: rulesResults
    };
}

module.exports = { runCore };
