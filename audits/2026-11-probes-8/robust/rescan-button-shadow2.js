'use strict';
// jsdom: a <button> inside a label with an inherited text-shadow. Scan 1 of a DOM passes contrast-minimum, scan 2 of the
// same DOM is notApplicable (the button's text taken as shadowed). Chromium: button text-shadow is 'none' (UA style), pass.
const L=require('./lib.js');const C=require('./chrome-lib.js');console.warn=()=>{};
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><label style="font-size:larger;text-shadow:0 0 2px #000">then<button>x</button></label></main></body></html>`;
const ro={includeRuleIds:['contrast-minimum','contrast-computable']};
const sig=(r)=>r.checksResults.map(c=>c.ruleId+':'+c.outcome+'/'+c.occurrences.length).join(' ');
const dom=L.open(html);
console.log('jsdom scan 1:',sig(L.scanJsdom(html,{},ro,dom).r));
console.log('jsdom scan 2 (same DOM):',sig(L.scanJsdom(html,{},ro,dom).r));
console.log('jsdom scan 3 (same DOM):',sig(L.scanJsdom(html,{},ro,dom).r));
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(html);await p.evaluate(C.BUNDLE);
for(let k=1;k<=2;k++){const r=await p.evaluate(()=>window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['contrast-minimum','contrast-computable']}));console.log('chrome scan '+k+':',sig(r));}
console.log('chrome button text-shadow:',await p.evaluate(()=>getComputedStyle(document.querySelector('button')).textShadow));await b.close();})();
