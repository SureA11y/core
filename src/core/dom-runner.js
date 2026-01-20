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
    const timestamp = new Date().toISOString();

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors
    });

    const rulesResults = [];

    for (const def of RULE_DEFS) {
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
            contextSelector: ctxSelector
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
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
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

        if (!result || typeof result !== 'object') continue;
        if (!result.engineOptions) {
            result.engineOptions = { locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy));
    }

    return {
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
        contextSelector: ctxSelector,
        rules: rulesResults
    };
}

module.exports = { runCore };
