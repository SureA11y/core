'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../src/core');
const { versionTagPrefixForScs } = require('../../src/coverage/wcag-version-map');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const ALL_PREFIXES = ['wcag2', 'wcag21', 'wcag22'];
const ALL_LEVEL_TAGS = ALL_PREFIXES.flatMap((p) => [`${p}a`, `${p}aa`, `${p}aaa`]);

function levelTagsFor(prefix) {
    return [`${prefix}a`, `${prefix}aa`, `${prefix}aaa`];
}

// Static consistency: every rule's meta.tags must carry the version-correct wcag2/wcag21/wcag22
// level tag for its wcagSc, and must not also carry a level tag from a different version prefix.
// Rules with no wcagSc (best-practice/advisory, no formal SC) are exempt -- there's no SC to
// derive a version from. This is the guard rail so a future rule authored for a WCAG 2.1/2.2 SC
// doesn't silently ship with the wrong (or a stale bare wcag2*) tag.
test('every rule with a wcagSc carries the version-correct wcag2*/wcag21*/wcag22* tag', () => {
    assert.ok(Array.isArray(core.CHECK_DEFS) && core.CHECK_DEFS.length > 0);

    for (const def of core.CHECK_DEFS) {
        const wcagSc = Array.isArray(def.wcagSc) ? def.wcagSc.map(String) : [];
        if (!wcagSc.length) continue;

        const tags = Array.isArray(def.tags) ? def.tags.map(String) : [];
        const expectedPrefix = versionTagPrefixForScs(wcagSc);
        const expectedLevelTags = levelTagsFor(expectedPrefix);
        const wrongLevelTags = ALL_LEVEL_TAGS.filter((t) => !expectedLevelTags.includes(t));

        const hasExpected = expectedLevelTags.some((t) => tags.includes(t));
        assert.ok(
            hasExpected,
            `${def.ruleId} maps to WCAG SC(s) [${wcagSc.join(', ')}] (origin prefix "${expectedPrefix}") ` +
            `but its tags [${tags.join(', ')}] carry none of [${expectedLevelTags.join(', ')}]`
        );

        const foundWrong = wrongLevelTags.filter((t) => tags.includes(t));
        assert.deepEqual(
            foundWrong,
            [],
            `${def.ruleId} maps to WCAG SC(s) [${wcagSc.join(', ')}] (origin prefix "${expectedPrefix}") ` +
            `but its tags also carry the wrong-version level tag(s) [${foundWrong.join(', ')}]`
        );
    }
});

// Behavioral: runOnly.tags filtering by WCAG version must actually change which atomic rules run,
// not just which tags are present in the catalog metadata.
test('runOnly.tags filters atomic rules by WCAG version (2.1 vs 2.2 vs baseline)', () => {
    const html = '<!doctype html><html><head><title>t</title></head><body><a href="/x">click</a></body></html>';

    const runOnlyWcag21aa = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag21aa'] } });
    const ids21 = runOnlyWcag21aa.checksResults.map((r) => r.ruleId);
    assert.ok(ids21.includes('autocomplete-valid'));
    assert.ok(ids21.includes('avoid-inline-spacing'));
    assert.ok(ids21.includes('css-orientation-lock'));
    assert.ok(!ids21.includes('target-size-minimum'), 'wcag22aa-only rule must not match a wcag21aa filter');
    assert.ok(!ids21.includes('contrast-minimum'), 'baseline wcag2aa rule must not match a wcag21aa filter');

    const runOnlyWcag22aa = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag22aa'] } });
    const ids22 = runOnlyWcag22aa.checksResults.map((r) => r.ruleId);
    assert.ok(ids22.includes('target-size-minimum'));
    assert.ok(!ids22.includes('autocomplete-valid'), 'wcag21aa-only rule must not match a wcag22aa filter');
    assert.ok(!ids22.includes('contrast-minimum'), 'baseline wcag2aa rule must not match a wcag22aa filter');

    const runOnlyBaseline = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2aa'] } });
    const idsBaseline = runOnlyBaseline.checksResults.map((r) => r.ruleId);
    assert.ok(idsBaseline.includes('contrast-minimum'));
    assert.ok(!idsBaseline.includes('autocomplete-valid'), 'wcag21aa rule must not match a baseline-only filter');
    assert.ok(!idsBaseline.includes('target-size-minimum'), 'wcag22aa rule must not match a baseline-only filter');
});

// Behavioral: the same version-aware filtering must apply to composite (WCAG-SC rollup) results,
// not just atomic rules -- composites previously carried a blanket wcag21* tag regardless of the
// SC's real origin version (see ROADMAP.md item 6), which this asserts is now fixed.
test('runOnly.tags filters composite (rulesResults) entries by WCAG version', () => {
    const html = '<!doctype html><html><head><title>t</title></head><body><a href="/x">click</a></body></html>';

    const runOnlyWcag21a = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag21a'] } });
    const composite21 = runOnlyWcag21a.rulesResults.map((r) => r.ruleId);
    assert.ok(composite21.includes('wcag-2.5.3-label-in-name'), '2.1-origin, level-A composite must match a wcag21a filter');
    assert.ok(
        !composite21.includes('wcag-2.4.1-bypass-blocks'),
        'baseline (WCAG 2.0), level-A composite must not match a wcag21a-only filter'
    );

    const runOnlyBaseline = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2a'] } });
    const compositeBaseline = runOnlyBaseline.rulesResults.map((r) => r.ruleId);
    assert.ok(compositeBaseline.includes('wcag-2.4.1-bypass-blocks'), 'baseline, level-A composite must match a wcag2a filter');
    assert.ok(
        !compositeBaseline.includes('wcag-2.5.3-label-in-name'),
        '2.1-origin composite must not match a baseline-only wcag2a filter'
    );
});
