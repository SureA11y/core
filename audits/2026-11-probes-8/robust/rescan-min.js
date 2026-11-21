'use strict';
// Shrink a page while "first scan on a DOM != second scan on the same DOM" (contrast rules, jsdom) holds.
const L=require('./lib.js');console.warn=()=>{};const fs=require('fs');
const {JSDOM}=L;
let html=fs.readFileSync(process.argv[2],'utf8');const ro={includeRuleIds:[process.argv[3]||'contrast-minimum']};
const sig=(r)=>JSON.stringify(r.checksResults.map(c=>[c.outcome,c.occurrences.map(o=>o.selector+o.summary)]));
function bad(h){try{const dom=L.open(h);const a=sig(L.scanJsdom(h,{},ro,dom).r);const b=sig(L.scanJsdom(h,{},ro,dom).r);return a!==b}catch(e){return false}}
console.log('initial',bad(html),html.length);
// element-level shrinking via DOM: try removing each element (largest first), keep if still bad
let changed=true;
while(changed){changed=false;
 const d=new JSDOM(html);const els=[...d.window.document.body.querySelectorAll('*')];
 for(let i=0;i<els.length;i++){
   const d2=new JSDOM(html);const e2=[...d2.window.document.body.querySelectorAll('*')][i];if(!e2)continue;
   // try remove element
   const par=e2.parentNode;const next=e2.nextSibling;e2.remove();let h2=d2.serialize();
   if(h2.length<html.length&&bad(h2)){html=h2;changed=true;break}
   par.insertBefore(e2,next);
   // try unwrap element (keep children)
   if(e2.childNodes.length){const frag=[...e2.childNodes];e2.replaceWith(...frag);h2=d2.serialize();if(h2.length<html.length&&bad(h2)){html=h2;changed=true;break}}
 }
 if(!changed){ // try removing attributes
   const d3=new JSDOM(html);const all=[...d3.window.document.querySelectorAll('*')];
   outer: for(let i=0;i<all.length;i++){for(const a of [...all[i].attributes]){const d4=new JSDOM(html);const e=[...d4.window.document.querySelectorAll('*')][i];e.removeAttribute(a.name);const h2=d4.serialize();if(bad(h2)){html=h2;changed=true;break outer}}}
 }
}
console.log(html);
