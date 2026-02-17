'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

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

test('composite catalog references only known atomic checks', () => {
    assert.equal(typeof core.getChecksCatalog, 'function');
    assert.equal(typeof core.getRulesCatalog, 'function');

    const atomic = core.getChecksCatalog(); // note: in your engine "rules" == atomic checks
    assert.ok(Array.isArray(atomic));

    const atomicIds = new Set(atomic.map(r => r && r.ruleId).filter(Boolean));

    const composites = core.getRulesCatalog();
    assert.ok(Array.isArray(composites));

    for (const c of composites) {
        assert.ok(c && typeof c === 'object', 'Composite entry must be an object');
        assert.ok(c.id, 'Composite entry missing id');
        assert.ok(Array.isArray(c.checksIds) && c.checksIds.length > 0, `Composite ${c.id} must have checksIds`);

        for (const tid of c.checksIds) {
            assert.ok(atomicIds.has(tid), `Composite ${c.id} references unknown testId: ${tid}`);
        }
    }
});

test('every WCAG-mapped atomic test is covered by at least one composite for that SC', () => {
    assert.ok(Array.isArray(core.CHECK_DEFS), 'Expected core.CHECK_DEFS to exist (generated core export)');
    assert.ok(Array.isArray(core.COMPOSITE_RULES), 'Expected core.COMPOSITE_RULES to exist (generated core export)');

    // Map SC -> set(testId) from composites
    const scToCompositeTests = new Map();
    for (const c of core.COMPOSITE_RULES) {
        const scList =
            c && c.meta && Array.isArray(c.meta.wcagSc)
                ? c.meta.wcagSc.map(String).map(s => s.trim()).filter(Boolean)
                : [];

        const checksIds = Array.isArray(c.checksIds) ? c.checksIds.map(String) : [];

        for (const sc of scList) {
            const set = scToCompositeTests.get(sc) || new Set();
            for (const tid of checksIds) set.add(tid);
            scToCompositeTests.set(sc, set);
        }
    }

    // For each atomic test that declares WCAG normative mapping(s),
    // ensure there is a composite for that SC that includes this test.
    for (const r of core.CHECK_DEFS) {
        if (!r || typeof r !== 'object' || !r.ruleId) continue;

        const scs = getWcagScFromNormativeMappings(r);
        if (!scs.length) continue; // only enforce for rules that declare WCAG mappings

        for (const sc of scs) {
            const set = scToCompositeTests.get(sc);
            assert.ok(set && set.size > 0, `No composite found for WCAG SC ${sc}`);
            assert.ok(set.has(r.ruleId), `Atomic test ${r.ruleId} (SC ${sc}) is not included in any composite for that SC`);
        }
    }
});

test('composite catalog references only known atomic checks (and has no dupes)', () => {
    assert.equal(typeof core.getChecksCatalog, 'function');
    assert.equal(typeof core.getRulesCatalog, 'function');

    const atomic = core.getChecksCatalog();
    assert.ok(Array.isArray(atomic));

    const atomicIds = new Set(atomic.map(r => r && r.ruleId).filter(Boolean));

    const composites = core.getRulesCatalog();
    assert.ok(Array.isArray(composites));

    const seenCompositeIds = new Set();

    for (const c of composites) {
        assert.ok(c && typeof c === 'object', 'Composite entry must be an object');
        assert.ok(c.id, 'Composite entry missing id');

        assert.ok(!seenCompositeIds.has(c.id), `Duplicate composite id: ${c.id}`);
        seenCompositeIds.add(c.id);

        assert.ok(Array.isArray(c.checksIds) && c.checksIds.length > 0, `Composite ${c.id} must have checksIds`);

        const seenTestIdsInComposite = new Set();
        for (const tid of c.checksIds) {
            assert.ok(!seenTestIdsInComposite.has(tid), `Composite ${c.id} has duplicate testId: ${tid}`);
            seenTestIdsInComposite.add(tid);

            assert.ok(atomicIds.has(tid), `Composite ${c.id} references unknown testId: ${tid}`);
        }
    }
});

test('every composite testId belongs to the composite SC (no misfiled checks)', () => {
    assert.ok(Array.isArray(core.CHECK_DEFS), 'Expected core.CHECK_DEFS to exist (generated core export)');
    assert.ok(Array.isArray(core.COMPOSITE_RULES), 'Expected core.COMPOSITE_RULES to exist (generated core export)');

    const ruleDefById = new Map();
    for (const r of core.CHECK_DEFS) {
        if (r && r.ruleId) ruleDefById.set(String(r.ruleId), r);
    }

    for (const c of core.COMPOSITE_RULES) {
        assert.ok(c && typeof c === 'object', 'Composite entry must be an object');
        assert.ok(c.id, 'Composite entry missing id');

        const scList =
            c && c.meta && Array.isArray(c.meta.wcagSc)
                ? c.meta.wcagSc.map(String).map(s => s.trim()).filter(Boolean)
                : [];

        // Your model: one WCAG SC per composite. Enforce it.
        assert.equal(scList.length, 1, `Composite ${c.id} must declare exactly one wcagSc`);
        const sc = scList[0];

        const checksIds = Array.isArray(c.checksIds) ? c.checksIds.map(String) : [];
        assert.ok(checksIds.length > 0, `Composite ${c.id} must have checksIds`);

        for (const tid of checksIds) {
            const rd = ruleDefById.get(tid);
            assert.ok(rd, `Composite ${c.id} references unknown testId: ${tid}`);

            const mappedScs = getWcagScFromNormativeMappings(rd);
            assert.ok(
                mappedScs.includes(sc),
                `Composite ${c.id} (SC ${sc}) includes test ${tid}, but that test does not declare WCAG SC ${sc} in normativeMappings`
            );
        }
    }
});

test('WCAG composite membership is exact for every WCAG-mapped atomic test (no missing, no extra)', () => {
    assert.ok(Array.isArray(core.CHECK_DEFS), 'Expected core.CHECK_DEFS to exist (generated core export)');
    assert.ok(Array.isArray(core.COMPOSITE_RULES), 'Expected core.COMPOSITE_RULES to exist (generated core export)');

    // Build: SC -> Set(testId) from composites
    const scToCompositeTests = new Map();
    for (const c of core.COMPOSITE_RULES) {
        const scList =
            c && c.meta && Array.isArray(c.meta.wcagSc)
                ? c.meta.wcagSc.map(String).map(s => s.trim()).filter(Boolean)
                : [];

        // enforce one SC per composite for determinism
        assert.equal(scList.length, 1, `Composite ${c && c.id ? c.id : '(unknown)'} must declare exactly one wcagSc`);
        const sc = scList[0];

        const checksIds = Array.isArray(c.checksIds) ? c.checksIds.map(String) : [];
        const set = scToCompositeTests.get(sc) || new Set();
        for (const tid of checksIds) set.add(tid);
        scToCompositeTests.set(sc, set);
    }

    // Build reverse: testId -> Set(SC) from composites
    const testIdToCompositeScs = new Map();
    for (const [sc, set] of scToCompositeTests.entries()) {
        for (const tid of set) {
            const s = testIdToCompositeScs.get(tid) || new Set();
            s.add(sc);
            testIdToCompositeScs.set(tid, s);
        }
    }

    for (const r of core.CHECK_DEFS) {
        if (!r || typeof r !== 'object' || !r.ruleId) continue;

        const testId = String(r.ruleId);
        const declaredScs = new Set(getWcagScFromNormativeMappings(r));

        if (declaredScs.size === 0) {
            // If you want: enforce that rules with no WCAG mapping must not appear in composites:
            const inComposites = testIdToCompositeScs.get(testId);
            assert.ok(!inComposites || inComposites.size === 0, `Atomic test ${testId} appears in composites but declares no WCAG normativeMappings`);
            continue;
        }

        // 1) Must exist a composite for each declared SC and must include this test
        for (const sc of declaredScs) {
            const set = scToCompositeTests.get(sc);
            assert.ok(set && set.size > 0, `No composite found for WCAG SC ${sc}`);
            assert.ok(set.has(testId), `Atomic test ${testId} declares SC ${sc} but is not included in any composite for that SC`);
        }

        // 2) Must NOT be listed under any SC it does not declare (no extra)
        const actualScs = testIdToCompositeScs.get(testId) || new Set();
        for (const sc of actualScs) {
            assert.ok(
                declaredScs.has(sc),
                `Atomic test ${testId} is included in composite SC ${sc} but does not declare that SC in normativeMappings`
            );
        }
    }
});

function normalizeScList(list) {
    const a = Array.isArray(list) ? list : [];
    const set = new Set(a.map(String).map(s => s.trim()).filter(Boolean));
    return Array.from(set).sort();
}

function getWcagScFromNormativeMappings(ruleDef) {
    const nm = Array.isArray(ruleDef && ruleDef.normativeMappings) ? ruleDef.normativeMappings : [];
    const out = [];
    for (const m of nm) {
        if (!m || typeof m !== 'object') continue;
        if (String(m.standard || '').toUpperCase() !== 'WCAG') continue;
        if (!m.requirement) continue;
        out.push(String(m.requirement).trim());
    }
    return normalizeScList(out);
}

test('contract: rule.wcagSc is derived from WCAG normativeMappings (exact match)', () => {
    assert.ok(Array.isArray(core.CHECK_DEFS));

    const mismatches = [];

    for (const r of core.CHECK_DEFS) {
        if (!r || !r.ruleId) continue;

        const fromNorm = getWcagScFromNormativeMappings(r);
        const fromRule = normalizeScList(r.wcagSc);

        const same =
            fromNorm.length === fromRule.length &&
            fromNorm.every((v, i) => v === fromRule[i]);

        if (!same) {
            mismatches.push({
                ruleId: r.ruleId,
                normativeMappingsWcagSc: fromNorm,
                wcagSc: fromRule
            });
        }
    }

    assert.deepEqual(
        mismatches,
        [],
        `Found ${mismatches.length} rule(s) where rule.wcagSc disagrees with WCAG normativeMappings`
    );
});
