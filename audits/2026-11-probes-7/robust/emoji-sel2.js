// Selector anchored on an astral-character attribute value, where the element is not unique by tag: jsdom vs Chromium.
const L=require('./lib.js');const C=require('./chrome-lib.js');console.warn=()=>{};
const V=process.argv[2]||'😀';const A=process.argv[3]||'data-testid';
const HTML=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main ${A}="${V}"><div><button></button></div></main><footer><div><button></button></div></footer></body></html>`;
(async()=>{
const {r,dom}=L.scanJsdom(HTML);const occ=r.checksResults.find(c=>c.ruleId==='button-name-present').occurrences;
const res=occ.map(o=>{let m;try{m=dom.window.document.querySelectorAll(o.selector).length}catch(e){m='ERR'}return [o.selector,m]});
const b=await C.launch();const p=await b.newPage();await p.setContent(HTML);await C.inject(p);
const rc=await C.scan(p,{},{includeRuleIds:['button-name-present']});
const cres=[];for(const o of rc.checksResults[0].occurrences)cres.push([o.selector,await p.evaluate((s)=>document.querySelectorAll(s).length,o.selector)]);
console.log(JSON.stringify({attr:A,value:V,jsdom:res,chrome:cres}));await b.close();})();
