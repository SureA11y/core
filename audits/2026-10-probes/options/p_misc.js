const {run,summ}=require('./h.js');
function occStats(r){ let sel=0,html=0,n=0,sp=0; for(const c of r.checksResults) for(const o of c.occurrences||[]){n++; if(o.selector) sel++; if(o.html) html++; if(o.structuralPath) sp++;} return {n,sel,html,sp}; }
let x=run({eo:{output:{includeSelector:false,includeHtml:false}}}); console.log('output off', occStats(x.r), 'withSel:', x.r.checksResults.filter(c=>(c.occurrences||[]).some(o=>o.selector)).map(c=>c.ruleId).join(','));
x=run({}); console.log('output on', occStats(x.r));
x=run({eo:{output:'none'}}); console.log('output str', occStats(x.r));
// probes
const circ={a:1}; circ.self=circ;
const big={pages:Array.from({length:5000},(_,i)=>({url:'u'+i,title:'x'.repeat(5000)}))};
const deep={}; let cur=deep; for(let i=0;i<5000;i++){cur.n={};cur=cur.n;}
const probesCases={circ:{crawl:circ}, big:{crawl:{pageTitles:big}}, deep:{deep}, fns:{f(){}, b:10n, s:Symbol('x'), d:new Date(0), m:new Map([[1,2]]), re:/x/, nan:NaN, u:undefined, arr:[()=>1,10n]}, arr:[1,2], str:'x', bigint:10n, getter:{get boom(){throw new Error('boom')}}, proxy:new Proxy({}, {ownKeys(){throw new Error('trap')}}) };
for (const [k,p] of Object.entries(probesCases)) { const x=run({eo:{probes:p}}); if(x.err){console.log('probes',k,'THROW',x.err.message.slice(0,120));continue;} let js; try{js=JSON.stringify(x.r).length}catch(e){js='JSONERR '+e.message} let sc; try{structuredClone(x.r); sc='ok'}catch(e){sc='SCERR '+e.message.slice(0,80)} const echo=x.r.checksResults[0].engineOptions.probes; let ej; try{ej=JSON.stringify(echo).slice(0,80)}catch(e){ej='ERR'} console.log('probes',k,'json',js,'clone',sc,'echo',ej); }
// timestamp
for (const ts of ['2026-01-01T00:00:00Z','  ',123,new Date(0),null]) { const x=run({eo:{timestamp:ts}}); console.log('ts',JSON.stringify(ts),'->',JSON.stringify(x.r.timestamp), 'echo', JSON.stringify(x.r.checksResults[0].engineOptions.timestamp)); }
// perf
for (const eo of [{perfStats:true},{profileRules:true},{perfStats:true,profileRules:true},{perfStats:'yes'}]) { const x=run({eo}); const p=x.r.perfStats; console.log('perf',JSON.stringify(eo), p==null?p:Object.keys(p).slice(0,12).join(','), p&&p.ruleTimings?'ruleTimings:'+Object.keys(p.ruleTimings).length:''); }
