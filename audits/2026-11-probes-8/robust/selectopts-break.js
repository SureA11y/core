'use strict';
// Where a jsdom scan of a <select> with N options spends its time: parse, warm-up, rules, the rest.
const L=require('./lib.js');console.warn=()=>{};
for(const N of (process.argv[2]||'5000,10000,20000').split(',').map(Number)){
let s='<label for="s">Pick</label><select id="s">';for(let i=0;i<N;i++)s+=`<option>${i}</option>`;s+='</select>';
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1>${s}</main></body></html>`;
let t=Date.now();const dom=L.open(html);const parse=Date.now()-t;
t=Date.now();const {r}=L.scanJsdom(html,{perfStats:true,profileRules:true},null,dom);const scan=Date.now()-t;
const rules=Object.values(r.perfStats.ruleTimings).reduce((a,b)=>a+b,0);
const top=Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+'='+Math.round(v));
console.log(JSON.stringify({N,parse,scan,warm:Math.round(r.perfStats.warmUpMs||0),rules:Math.round(rules),rest:Math.round(scan-rules-(r.perfStats.warmUpMs||0)),top,keys:Object.keys(r.perfStats)}));}
