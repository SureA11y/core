'use strict';

const LEVEL_RANK = Object.freeze({ A: 1, AA: 2, AAA: 3 });

function normalizeScanLevel(scanLevel) {
    if (scanLevel === 'A' || scanLevel === 'AA' || scanLevel === 'AAA') return scanLevel;
    return null;
}

/**
 * Try to infer scan level deterministically from runOnly.tags if provided by the caller.
 * (If you already pass scanLevel explicitly, you can ignore this.)
 */
function inferScanLevelFromRunOnly(runOnly) {
    const tags = runOnly && Array.isArray(runOnly.tags) ? runOnly.tags : null;
    if (!tags || tags.length === 0) return null;

    // Common reference-engine-style tags; adjust if your app uses different ones.
    if (tags.includes('wcag2aaa') || tags.includes('wcag22aaa')) return 'AAA';
    if (tags.includes('wcag2aa') || tags.includes('wcag22aa')) return 'AA';
    if (tags.includes('wcag2a') || tags.includes('wcag22a')) return 'A';

    return null;
}

function isWithinTargetLevel(compositeLevel, scanLevel) {
    const c = LEVEL_RANK[compositeLevel];
    const s = LEVEL_RANK[scanLevel];
    if (!c || !s) return false;
    return c <= s;
}

function aggregateOutcome(childOutcomes) {
    // Deterministic priority: fail > cantTell > pass > notApplicable
    let hasPass = false;
    let hasCantTell = false;

    for (const o of childOutcomes) {
        if (o === 'fail') return 'fail';
        if (o === 'cantTell') hasCantTell = true;
        else if (o === 'pass') hasPass = true;
    }

    if (hasCantTell) return 'cantTell';
    if (hasPass) return 'pass';
    return 'notApplicable';
}

/**
 * Roll up atomic rule results into composite (SC) results, filtered by target level.
 *
 * Inputs are plain JS objects/arrays; function never throws and is deterministic.
 */
function rollupComposites({
                              atomicResults,
                              composites,
                              scanLevel,
                              runOnly
                          }) {
    try {
        const target =
            normalizeScanLevel(scanLevel) ||
            inferScanLevelFromRunOnly(runOnly) ||
            'AAA'; // safest default: if unspecified, do not hide anything

        const atomicByRuleId = Object.create(null);
        if (Array.isArray(atomicResults)) {
            for (const r of atomicResults) {
                if (!r || typeof r.ruleId !== 'string') continue;
                atomicByRuleId[r.ruleId] = r;
            }
        }

        const out = [];
        const list = Array.isArray(composites) ? composites : [];
        for (const c of list) {
            const level = c && c.meta && c.meta.level;
            if (!isWithinTargetLevel(level, target)) continue;

            const checksIds = Array.isArray(c.checksIds) ? c.checksIds : [];
            const childOutcomes = checksIds.map((id) => {
                const rr = atomicByRuleId[id];
                return rr && typeof rr.outcome === 'string' ? rr.outcome : 'notApplicable';
            });

            const outcome = aggregateOutcome(childOutcomes);

            // Deterministic i18n keys + structured details (matches your reporting schema expectations)
            const i18nKey =
                outcome === 'fail'
                    ? 'composite.outcome.fail'
                    : outcome === 'cantTell'
                        ? 'composite.outcome.cantTell'
                        : outcome === 'pass'
                            ? 'composite.outcome.pass'
                            : 'composite.outcome.notApplicable';

            out.push({
                ruleId: c.id,
                outcome,
                confidence: outcome === 'cantTell' ? 'low' : 'high',
                summaryKey: i18nKey, // resolved at build-time by your i18n layer
                i18nKey,
                i18nParams: {
                    wcagSc: (c.meta && c.meta.wcagSc && c.meta.wcagSc[0]) || null,
                    level: level || null,
                    scanLevel: target
                },
                data: {
                    details: {
                        reasonCode:
                            outcome === 'cantTell'
                                ? 'oneOrMoreChecksCantTell'
                                : outcome === 'fail'
                                    ? 'oneOrMoreChecksFailed'
                                    : outcome === 'pass'
                                        ? 'allApplicableChecksPassed'
                                        : 'allChecksNotApplicable',
                        scanLevel: target,
                        compositeLevel: level || null,
                        checksIds,
                        childOutcomes
                    }
                }
            });
        }

        return out;
    } catch (e) {
        // no-throws guarantee
        return [];
    }
}

module.exports = { rollupComposites };
