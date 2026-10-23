const {gen}=require('./gen.js');const {scan,stripVolatile}=require('./check.js');console.warn=()=>{};
const seed=+process.argv[2];const rule=process.argv[3];const c=gen(seed);c.engineOptions=JSON.parse(process.argv[4]||'{}');
const outs=[true,false,false,true,false].map(p=>{const a=scan(c,{profile:p});const cr=a.result.checksResults.find(x=>x.ruleId===rule);return (p?'P ':'- ')+cr.outcome+' '+cr.occurrences.map(o=>o.selector+'::'+(o.i18n&&o.i18n.summaryKey)).join(' | ').slice(0,600)});
console.log(outs.join('\n'));
