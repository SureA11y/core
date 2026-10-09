'use strict';
// A standard pack's key, ruleTag and rollup ids are not tied to the pack's
// namespace: what can they collide with or take over?
const { scan, quiet, base, rule, report, packApi } = require('./lib.js');
const { ruleMappedStandard, wcagTags, describePacks } = packApi;
const plainIds = scan({}).checksResults.map((c) => c.ruleId);

function stdPack({ key = 'mystd', tag = 'mystd', ns = 'p', reqs, map, profiles } = {}) {
  const versions = [{ version: '1.0', wcagVersion: '2.2' }];
  const requirements = reqs || { '1.0': { 1: { title: 'Images', wcagSc: ['1.1.1'] }, 2: { title: 'Untested', wcagSc: [] } } };
  const ruleMap = map || { '1.0': { 'img-alt-present': { requirements: ['1'] } } };
  const fns = ruleMappedStandard({ standard: 'My Std', tag, versions, requirements, ruleMap });
  return base({ name: `std-${key}-${tag}`, namespace: ns, standard: {
    key, standard: 'My Std', versions: ['1.0'],
    profiles: profiles || { [`${ns}-1.0`]: { version: '1.0', tags: wcagTags('2.2').concat([tag]), mappedRules: true } },
    ruleTag: tag, ruleMapped: true, mappingsFor: fns.mappingsFor, composites: fns.composites, validate: fns.validate } });
}
function run(label, pack, opts = {}) {
  const { r, error } = quiet(() => scan({ packs: [pack], ...opts }));
  if (error) return report(label, 'THROWS ' + error.message.slice(0, 300));
  const lost = plainIds.filter((id) => !r.checksResults.some((c) => c.ruleId === id));
  report(label, { packs: r.engine.packs, skipped: r.skippedPacks && r.skippedPacks.map((s) => s.reason.slice(0, 200)),
    profile: r.engine.profile, standards: r.standards, lostFromDefault: opts.profile ? undefined : lost.length,
    stdRollups: r.rulesResults.filter((x) => x.meta && x.meta.standard === 'My Std').map((x) => `${x.ruleId}:${x.outcome}`) });
}
run('baseline standard pack, its profile', stdPack(), { profile: 'p-1.0' });
run('requirement with no rule (2) -> rollups listed', stdPack(), { profile: 'p-1.0' });
run('ruleTag best-practice (standard path)', stdPack({ tag: 'best-practice' }));
run('ruleTag landmarks', stdPack({ tag: 'landmarks' }));
run('standard key en301549 (core key)', stdPack({ key: 'en301549' }));
run('standard key not namespaced: "other"', stdPack({ key: 'other', tag: 'other' }));
run('standard key "constructor"', stdPack({ key: 'constructor', tag: 'constructor' }));
run('rollup ids not namespaced (tag "wcag-x"?)', stdPack({ tag: 'zz' }), { profile: 'p-1.0' });
run('profile not namespaced: "a11y-strict"', stdPack({ profiles: { 'a11y-strict': { version: '1.0', tags: ['mystd'] } } }), { profile: 'a11y-strict' });
run('profile version not in versions', stdPack({ profiles: { 'p-9': { version: '9.9', tags: ['mystd'], mappedRules: true } } }), { profile: 'p-9' });
run('rule map names unknown rule', stdPack({ map: { '1.0': { 'nope-rule': { requirements: ['1'] } } } }));
run('rule map names unknown requirement', stdPack({ map: { '1.0': { 'img-alt-present': { requirements: ['99'] } } } }));
// describePacks on standards missing pieces
for (const [label, std] of [['standard {}', {}], ['standard without composites', { key: 'k', standard: 'K', versions: ['1'] }], ['standard versions string', { key: 'k', standard: 'K', versions: '1.0' }]]) {
  try { report('describePacks ' + label, describePacks([base({ standard: std })])); }
  catch (e) { report('describePacks ' + label, 'THROWS ' + e.constructor.name + ': ' + e.message); }
}
for (const [label, pack] of [['rules with null entry', base({ rules: [null] })], ['variants with null', base({ variants: [null] })], ['probes readBy string', base({ rules: [rule('p-a')], probes: { 'a.b': { description: 'd', readBy: 'p-a' } } })], ['dictionaries with null dict', base({ dictionaries: { en: null } })]]) {
  try { report('describePacks ' + label, describePacks([pack])); }
  catch (e) { report('describePacks ' + label, 'THROWS ' + e.constructor.name + ': ' + e.message); }
}
