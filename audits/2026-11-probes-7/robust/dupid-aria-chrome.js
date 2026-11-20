// duplicate-id-aria in Chromium: N cards each with <h3 id="title"> and <a aria-labelledby="title">. Median of 3.
const C=require('./chrome-lib.js');const L=require('./lib.js');
(async()=>{const b=await C.launch();
for(const N of (process.argv[2]||'50,100,200,400').split(',').map(Number)){let s='';for(let i=0;i<N;i++)s+=`<div class="card"><h3 id="title">Card ${i}</h3><a href="/p${i}" aria-labelledby="title">Open</a></div>`;
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}</main></body></html>`;const ts=[];let full;
for(let k=0;k<3;k++){const p=await b.newPage();await p.setContent(html);await C.inject(p);
const r=await p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(null,null,{perfStats:true,profileRules:true},null);return {rule:r.perfStats.ruleTimings['duplicate-id-aria'],total:Object.values(r.perfStats.ruleTimings).reduce((a,b)=>a+b,0),occ:r.checksResults.find(c=>c.ruleId==='duplicate-id-aria').occurrences.length}});ts.push(r);await p.close();}
console.log(JSON.stringify({N,elements:2*N+3,ruleMs:Math.round(L.median(ts.map(x=>x.rule))),allRulesMs:Math.round(L.median(ts.map(x=>x.total))),occ:ts[0].occ}));}
await b.close();})();
