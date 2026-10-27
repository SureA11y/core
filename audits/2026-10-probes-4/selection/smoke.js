const L = require('./lib');
const r = L.scan(null, { packs: [L.samplePack], profile: 'sample-1.0' });
if (r.error) throw r.error;
console.log(r.value.engine.profile, r.value.engine.wcagVersion, r.value.rulesResults.map(x=>x.ruleId+':'+x.outcome).join('\n'));
console.log(r.warned);
const l = L.core.getRulesForRunOnly(null, { packs: [L.samplePack], profile: 'sample-1.0' }).map(x=>x.id);
console.log(JSON.stringify(l) === JSON.stringify(r.value.rulesResults.map(x=>x.ruleId)));
console.log(L.samplePack.rules.map(r=>r.id), Object.keys(L.samplePack.standard||{}));
