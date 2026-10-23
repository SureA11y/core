const { run, pick, core } = require('./h');
const ok = (ctx)=>({outcome:'pass',occurrences:[]});
function show(label, eo, runOnly){
  const { res, err, warns } = run(eo, runOnly);
  if (err) return console.log(label.padEnd(28),'THROW', err.message.slice(0,200));
  const ids = (eo.customRules||[]).map(c=>c&&c.id).filter(x=>typeof x==='string');
  const rs = res.checksResults.filter(r=>ids.includes(r.ruleId) || r.ruleId.startsWith('z-'));
  console.log(label.padEnd(28), JSON.stringify(rs.map(r=>({id:r.ruleId,t:r.title,o:r.outcome,sev:r.severity,conf:r.confidence,type:r.type,err:r.error,n:r.occurrences.length,tags:undefined}))), 'overridden=',JSON.stringify(res.overriddenBuiltinIds), 'total=',res.checksResults.length, 'rules=',res.rulesResults.length, warns.length?'WARN:'+warns.join('|').slice(0,200):'');
}
show('missing id', { customRules:[{ meta:{}, runInPage: ok }] }, ['wcag2a']);
show('id with spaces', { customRules:[{ id:' z-sp ', meta:{}, runInPage: ok }] }, null);
show('runOnly arr id w/ spaces', { customRules:[{ id:' z-sp ', meta:{}, runInPage: ok }] }, ['z-sp']);
show('dup ids', { customRules:[{ id:'z-dup', meta:{title:'first'}, runInPage: ok },{ id:'z-dup', meta:{title:'second'}, runInPage: (c)=>({outcome:'fail',occurrences:[]}) }] }, ['z-dup']);
show('builtin collide', { customRules:[{ id:'image-alt', meta:{title:'mine'}, runInPage: ok }] }, null);
const comp = core.COMPOSITE_RULES[0].id; const compChecks = core.COMPOSITE_RULES[0].checksIds;
console.log('composite', comp, compChecks);
show('composite collide', { customRules:[{ id: comp, meta:{title:'mine'}, runInPage: (c)=>({outcome:'fail',occurrences:[]}) }] }, [comp]);
show('meta string', { customRules:[{ id:'z-m1', meta:'hello', runInPage: ok }] }, ['z-m1']);
show('meta missing', { customRules:[{ id:'z-m2', runInPage: ok }] }, ['z-m2']);
show('weird severity', { customRules:[{ id:'z-m3', meta:{defaultSeverity:'blocker', defaultConfidence:'certain', type:'Manual', tags:'mytag'}, runInPage: (c)=>({outcome:'fail',occurrences:[{summary:'s'}]}) }] }, ['z-m3']);
show('returned severity', { customRules:[{ id:'z-m4', meta:{}, runInPage: (c)=>({outcome:'fail',severity:'blocker',confidence:'certain',occurrences:[{summary:'s'}]}) }] }, ['z-m4']);
show('deprecated no info', { customRules:[{ id:'z-m5', meta:{deprecated:true}, runInPage: ok }] }, null);
show('i18n no titleKey', { customRules:[{ id:'z-m6', meta:{i18n:{}}, runInPage: ok }] }, null);
const outs = {
 failed: ()=>({outcome:'failed',occurrences:[{summary:'x'}]}),
 undef: ()=>undefined,
 nul: ()=>null,
 str: ()=>'fail',
 throws: ()=>{ throw new Error('boom'); },
 throwsStr: ()=>{ throw 'plain'; },
 failEmpty: ()=>({outcome:'fail',occurrences:[]}),
 failNoOcc: ()=>({outcome:'fail'}),
 naWithOcc: ()=>({outcome:'notApplicable',occurrences:[{summary:'x'}]}),
 passWithOcc: ()=>({outcome:'pass',occurrences:[{summary:'x'}]}),
 occObj: ()=>({outcome:'fail',occurrences:{summary:'x'}}),
 occStrs: ()=>({outcome:'fail',occurrences:['a', 5, null]}),
 nodeOnly: (ctx)=>({outcome:'fail',occurrences:[{__node: ctx.document.querySelector('img')}]}),
 nodePass: (ctx)=>({outcome:'pass',occurrences:[{__node: ctx.document.querySelector('img')}]}),
 extraKeys: ()=>({outcome:'pass',occurrences:[], foo: 1, ruleId:'hijack', title:'T2', type:'manual'}),
 inapplicable: ()=>({outcome:'inapplicable',occurrences:[]}),
 nodeNonElem: (ctx)=>({outcome:'fail',occurrences:[{__node: 'notanode'}]}),
};
for (const [k,f] of Object.entries(outs)) show('ret '+k, { customRules:[{ id:'z-'+k, meta:{}, runInPage: f }] }, ['z-'+k]);
// circular data
const circ = {a:1}; circ.self = circ;
const { res } = run({ customRules:[{ id:'z-circ', meta:{}, data: circ, runInPage: (c)=>{ const o={summary:'x'}; o.me=o; return {outcome:'fail',occurrences:[o], evidence: circ}; } }] }, ['z-circ']);
try { JSON.stringify(res); console.log('circ JSON ok'); } catch(e) { console.log('circ JSON THROW', e.message); }
// huge occurrences
const t0=Date.now();
const r2 = run({ customRules:[{ id:'z-huge', meta:{}, runInPage: (ctx)=>({outcome:'fail',occurrences:Array.from({length:200000},(_,i)=>({__node: ctx.document.body, summary:'n'+i}))}) }] }, ['z-huge']);
console.log('huge', pick(r2.res,'z-huge').occurrences.length, Date.now()-t0,'ms');
