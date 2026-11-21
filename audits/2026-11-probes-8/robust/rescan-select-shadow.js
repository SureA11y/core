'use strict';
// jsdom: the first scan of a DOM and a second scan of the same DOM disagree on a <select> under text-shadow + font-size:larger.
// node rescan-select-shadow.js
const L=require('./lib.js');console.warn=()=>{};
const variants={
 min:`<label style="font-size:larger;text-shadow:0 0 2px #000">then<select><option>x</option></select></label>`,
 noLarger:`<label style="text-shadow:0 0 2px #000">then<select><option>x</option></select></label>`,
 em:`<label style="font-size:1.2em;text-shadow:0 0 2px #000">then<select><option>x</option></select></label>`,
 larger:`<label style="font-size:larger">then<select><option>x</option></select></label>`,
 smaller:`<label style="font-size:smaller;text-shadow:0 0 2px #000">then<select><option>x</option></select></label>`,
 button:`<label style="font-size:larger;text-shadow:0 0 2px #000">then<button>x</button></label>`,
 input:`<label style="font-size:larger;text-shadow:0 0 2px #000">then<input value="x"></label>`,
};
const ro={includeRuleIds:['contrast-computable','contrast-minimum']};
const sig=(r)=>r.checksResults.map(c=>c.ruleId+':'+c.outcome+' ['+c.occurrences.map(o=>(o.selector||'')+' '+((o.data&&o.data.details&&o.data.details.reasonCode)||'')+' '+o.summary.replace(/^.*Eligible/,'Eligible').slice(0,50)).join('; ')+']').join(' | ');
for(const [k,b] of Object.entries(variants)){const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main>${b}</main></body></html>`;
const dom=L.open(html);const a=sig(L.scanJsdom(html,{},ro,dom).r);const c=sig(L.scanJsdom(html,{},ro,dom).r);
console.log(k, a===c?'same':'DIFFERENT');if(a!==c){console.log('  1st:',a);console.log('  2nd:',c);}}
