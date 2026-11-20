// A page that owns window.__a11ycoreSharedCache (non-writable, pre-filled) — does the scan use the page's values?
const C=require('./chrome-lib.js');
const HTML='<html lang="en"><title>t</title><body><main><h1>x</h1><button id="b"></button><img id="i" src="a.png"></main></body></html>';
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(HTML);await C.inject(p);
const clean=await p.evaluate(()=>window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['button-name-present','img-alt-present']}).checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.map(o=>o.selector).join('|')));
await p.evaluate(()=>{delete window.__a11ycoreSharedCache;const btn=document.getElementById('b');
 const accessibleNameCacheByKey=new Map();
 Object.defineProperty(window,'__a11ycoreSharedCache',{value:Object.freeze({dom:{selectorCache:new Map(),accessibleNameCacheByKey:new Proxy(new Map(),{})}}),writable:false,configurable:false});});
const poisoned=await p.evaluate(()=>{try{return window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['button-name-present','img-alt-present']}).checksResults.map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.map(o=>o.selector).join('|')+(c.error?' ERR '+c.error:''))}catch(e){return 'THROW '+e.message}});
console.log({clean,poisoned});await b.close();})();
