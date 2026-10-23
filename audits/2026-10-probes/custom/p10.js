const { run, pick, core } = require('./h');
const noalt = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><img src="x.png"></main></body></html>`;
let o = run({ customRules:[{ id:'z', meta:{}, applicability:'function(ctx){ return false', runInPage:()=>({outcome:'fail',occurrences:[]}) }] }, ['z'], null, noalt);
console.log('bad applicability string ->', pick(o.res,'z').outcome, o.warns);
o = run({ customRules:[{ id:'z', meta:{}, applicability: async ()=>false, runInPage:()=>({outcome:'fail',occurrences:[]}) }] }, ['z'], null, noalt);
console.log('async applicability false ->', pick(o.res,'z').outcome);
o = run({ customRules:[{ id:'z', meta:{}, applicability: ()=>'no', runInPage:()=>({outcome:'fail',occurrences:[]}) }] }, ['z'], null, noalt);
console.log('applicability returns "no" ->', pick(o.res,'z').outcome);
// override built-in, under profile
const base = run({ profile:'wcag22-aa' }, null, null, noalt);
console.log('baseline wcag22-aa img-alt-present:', pick(base.res,'img-alt-present').outcome, 'composite:', base.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content').outcome);
o = run({ profile:'wcag22-aa', customRules:[{ id:'img-alt-present', meta:{title:'my stricter'}, runInPage:()=>({outcome:'fail',occurrences:[]}) }] }, null, null, noalt);
console.log('override w/o tags under profile: present?', !!pick(o.res,'img-alt-present'), 'overridden=', o.res.overriddenBuiltinIds, 'composite:', o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content').outcome, 'checksIds has it:', o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content').data.details.checksIds.includes('img-alt-present'));
o = run({ customRules:[{ id:'img-alt-present', meta:{title:'lenient'}, runInPage:()=>({outcome:'pass',occurrences:[]}) }] }, null, null, noalt);
const c = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content');
console.log('override pass default run: custom', pick(o.res,'img-alt-present').outcome, 'rollupIds', pick(o.res,'img-alt-present').rollupIds, 'composite', c.outcome, 'nm on override', JSON.stringify(pick(o.res,'img-alt-present').meta.normativeMappings));
