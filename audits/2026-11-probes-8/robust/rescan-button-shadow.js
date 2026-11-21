'use strict';
// jsdom: a button inside a label with text-shadow. Does getComputedStyle(button).textShadow change across a scan,
// and which scan agrees with Chromium? node rescan-button-shadow.js
const L=require('./lib.js');const C=require('./chrome-lib.js');console.warn=()=>{};
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><label style="text-shadow:0 0 2px #000">then<button style="color:#000;background:#fff">x</button></label></main></body></html>`;
const ro={includeRuleIds:['contrast-minimum']};
const sig=(r)=>r.checksResults.map(c=>c.ruleId+':'+c.outcome+'/'+c.occurrences.length+' '+(c.occurrences[0]?c.occurrences[0].summary.slice(0,70):'')).join(' | ');
const dom=L.open(html);const w=dom.window;const btn=w.document.querySelector('button');
console.log('jsdom textShadow before',JSON.stringify(w.getComputedStyle(btn).textShadow));
console.log('jsdom scan1',sig(L.scanJsdom(html,{},ro,dom).r));
console.log('jsdom textShadow after',JSON.stringify(w.getComputedStyle(btn).textShadow));
console.log('jsdom scan2',sig(L.scanJsdom(html,{},ro,dom).r));
const d2=L.open(html);const w2=d2.window;w2.getComputedStyle(d2.window.document.querySelector('button')).textShadow;
console.log('jsdom fresh DOM, style read first:',sig(L.scanJsdom(html,{},ro,d2).r));
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(html);await p.evaluate(C.BUNDLE);
const r=await p.evaluate(()=>[getComputedStyle(document.querySelector('button')).textShadow,window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['contrast-minimum']})]);
console.log('chrome textShadow',r[0],'scan',sig(r[1]));await b.close();})();
