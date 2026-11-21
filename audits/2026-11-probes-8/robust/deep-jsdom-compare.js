'use strict';
// Deep nesting under jsdom: 1.17.0 vs main bundle, total and warm-up, depth d and 2d.
const J=require('./jsdom-bundle.js');
const build=(dom,d)=>{const doc=dom.window.document;let c=doc.querySelector('main');for(let i=0;i<d;i++){const e=doc.createElement('div');if(i%31===0)e.style.color='#777';c.appendChild(e);c=e;}c.innerHTML='<a href="#">deep link</a><button></button><span>text</span>';};
for(const d of (process.argv[2]||'500,1000,2000').split(',').map(Number))for(const v of ['base','head']){
 const {r,ms}=J.scanWith(v,'<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main></main></body></html>',undefined,null,(dom)=>build(dom,d));
 const top=Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,x])=>k+'='+Math.round(x));
 console.log(JSON.stringify({d,v,ms,warm:Math.round(r.perfStats.warmUpMs||0),errors:r.checksResults.filter(c=>c.error).length,top}));}
