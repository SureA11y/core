// landmark-unique: N unnamed <nav> landmarks. Each finding lists the others, so the result grows with N squared?
const L=require('./lib.js');console.warn=()=>{};
for(const N of (process.argv[2]||'10,100,500,1000').split(',').map(Number)){
let s='';for(let i=0;i<N;i++)s+=`<nav><a href="/${i}">Nav item ${i}</a></nav>`;
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1></main>${s}</body></html>`;
const t=Date.now();const {r}=L.scanJsdom(html,{},{includeRuleIds:['landmark-unique']});const ms=Date.now()-t;const c=r.checksResults[0];
const json=JSON.stringify(c);const maxHint=Math.max(...c.occurrences.map(o=>o.summary.length+o.hint.length));
console.log(JSON.stringify({N,ms,occurrences:c.occurrences.length,resultMB:+(json.length/1048576).toFixed(2),longestSummaryPlusHint:maxHint,sample:c.occurrences[0]&&c.occurrences[0].summary.slice(0,160)}));}
