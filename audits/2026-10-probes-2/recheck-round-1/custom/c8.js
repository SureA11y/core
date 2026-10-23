const { scan, cr } = require('./h');
for (const entry of ['node','inpage']) {
const o = scan(null, { customRules: [{ id: 'z', meta: {}, runInPage: "(ctx)=>({outcome:'fail',occurrences:[{message:'m'}], wcagVersionScope:{target:'2.2',removedSc:['4.1.1'],coercedFrom:'fail'}, engineOptions:{spoof:1}, rollupIds:['x'], schemaVersion:'9', ruleId:'evil', meta:{spoof:true}, title:'T', outcomeNormalized:'pass', foo:1})" }] }, ['z'], entry);
const r = o.res.checksResults[0];
console.log(entry, JSON.stringify({ruleId:r.ruleId, id:r.id, wvs:r.wcagVersionScope, eo:r.engineOptions, rollupIds:r.rollupIds, schemaVersion:r.schemaVersion, meta:r.meta && r.meta.spoof, title:r.title, on:r.outcomeNormalized, outcome:r.outcome, foo:r.foo}));
}
