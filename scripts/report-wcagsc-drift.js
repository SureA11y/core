'use strict';

const core = require('../src/core');

function getWcagScFromNormativeMappings(ruleDef) {
    const nm = Array.isArray(ruleDef && ruleDef.normativeMappings) ? ruleDef.normativeMappings : [];
    const out = [];
    for (const m of nm) {
        if (!m || typeof m !== 'object') continue;
        if (String(m.standard || '').toUpperCase() !== 'WCAG') continue;
        if (!m.requirement) continue;
        out.push(String(m.requirement).trim());
    }
    return out.filter(Boolean);
}

function normalizeScList(list) {
    const a = Array.isArray(list) ? list : [];
    const set = new Set(a.map(String).map(s => s.trim()).filter(Boolean));
    return Array.from(set).sort();
}

const diffs = [];

for (const r of (core.CHECK_DEFS || [])) {
    if (!r || !r.ruleId) continue;

    const fromNorm = normalizeScList(getWcagScFromNormativeMappings(r));
    const fromMeta = normalizeScList(r.wcagSc);

    const same =
        fromNorm.length === fromMeta.length &&
        fromNorm.every((v, i) => v === fromMeta[i]);

    if (!same) {
        diffs.push({
            ruleId: r.ruleId,
            normative: fromNorm,
            meta: fromMeta
        });
    }
}

console.log(`wcagSc drift count: ${diffs.length}\n`);
for (const d of diffs) {
    console.log(`- ${d.ruleId}`);
    console.log(`  normativeMappings WCAG: ${JSON.stringify(d.normative)}`);
    console.log(`  meta.wcagSc:            ${JSON.stringify(d.meta)}\n`);
}

process.exit(diffs.length ? 1 : 0);