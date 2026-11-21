// duplicate-id-aria: N elements share one id that an aria-labelledby names (a repeated card component). Time and result size vs N.
const L=require('./lib.js');console.warn=()=>{};
const variant=process.argv[3]||'one-ref';
for(const N of (process.argv[2]||'250,500,1000,2000').split(',').map(Number)){
let s='';
if(variant==='one-ref'){for(let i=0;i<N;i++)s+=`<span id="title">T${i}</span>`;s+='<button aria-labelledby="title"></button>';}
else {for(let i=0;i<N;i++)s+=`<div class="card"><h3 id="title">Card ${i}</h3><a href="/p${i}" aria-labelledby="title">Open</a></div>`;}
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}</main></body></html>`;
const t=Date.now();const {r}=L.scanJsdom(html,{perfStats:true,profileRules:true},{includeRuleIds:['duplicate-id-aria','duplicate-id']});const ms=Date.now()-t;
const c=r.checksResults.find(c=>c.ruleId==='duplicate-id-aria');const d=r.checksResults.find(c=>c.ruleId==='duplicate-id');
const maxOcc=Math.max(...c.occurrences.map(o=>JSON.stringify(o).length));
console.log(JSON.stringify({variant,N,ms,ariaMs:Math.round(r.perfStats.ruleTimings['duplicate-id-aria']),dupMs:Math.round(r.perfStats.ruleTimings['duplicate-id']),ariaOcc:c.occurrences.length,ariaMB:+(JSON.stringify(c).length/1048576).toFixed(2),largestOccKB:+(maxOcc/1024).toFixed(1),dupMB:+(JSON.stringify(d).length/1048576).toFixed(2)}));}
