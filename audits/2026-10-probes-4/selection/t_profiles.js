const L = require('./lib'); const PK = require('./packs'); const { core } = L;
const cases = [
  [null, { packs: [PK.standardPack], profile: 'probe-1.0' }],
  [null, { packs: [PK.standardPack], profile: 'probe-2.0' }],
  [null, { packs: [PK.standardPack], profile: 'probe-2.0-plus' }],
  [null, { packs: [PK.standardPack], profile: 'probe-2.0-plus', wcagLevel: 'A' }],
  [null, { packs: [PK.standardPack], profile: 'probe-2.0-wcag' }],
  [{ bestPractices: true }, { packs: [PK.standardPack], profile: 'probe-2.0' }],
  [{ excludeRuleIds: ['heading-order'] }, { packs: [PK.standardPack], profile: 'probe-2.0' }],
  [null, { packs: [PK.waivePack], profile: 'wv-244' }],
  [null, { packs: [PK.waivePack], profile: 'wv-412' }],
  [null, { packs: [PK.waivePack], profile: 'wv-rules' }],
  [null, { packs: [PK.waivePack], profile: 'wv-rules', wcagLevel: 'AA' }],
  [null, { packs: [PK.waivePack], profile: 'wv-mixed' }],
  [null, { packs: [PK.waivePack], profile: 'wv-ruleex' }],
  [{ bestPractices: true }, { packs: [PK.waivePack], profile: 'wv-244' }],
];
for (const [ro, eo] of cases) {
  const s = L.scan(ro, eo, L.PAGE);
  const g = L.capture(() => core.getRulesForRunOnly(ro, eo));
  const r = s.value;
  const ids = r.rulesResults.map((x) => x.ruleId);
  console.log('###', JSON.stringify(ro), eo.profile, eo.wcagLevel || '', 'engine.profile=', r.engine.profile, 'v=', r.engine.wcagVersion, 'excl=', JSON.stringify(r.engine.profileExcludes));
  console.log('  rollups:', r.rulesResults.map((x) => x.ruleId.replace('wcag-', '').replace(/-[a-z-]+$/, '') + ':' + x.outcome + (x.data.details.reasonCode.includes('notSelected') ? '*' : '')).join(' '));
  console.log('  list==scan', JSON.stringify(g.value.map((x) => x.id)) === JSON.stringify(ids));
  const lnp = r.checksResults.find((c) => c.ruleId === 'link-name-present');
  console.log('  link-name-present:', lnp ? lnp.outcome + ' rollupIds=' + lnp.rollupIds.join(',') : 'not run', '| checks', r.checksResults.length, 'warn', s.warned.map((w) => w.slice(0, 150)));
}
