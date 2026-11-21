'use strict';
const L=require('./lib.js');const G=require('./gen.js');console.warn=()=>{};
const i=1122;const html=G.make(i,{budget:40+(i%7)*40,maxDepth:4+(i%9)});require('fs').writeFileSync('out/page-1122.html',html);
const dom=L.open(html);const ro={includeRuleIds:['contrast-computable','contrast-minimum']};
const p=(r)=>r.checksResults.map(c=>c.ruleId+':'+c.outcome+'/'+c.occurrences.length+' '+(c.occurrences.find(o=>/Computable/.test(o.summary))||{summary:''}).summary.slice(-30)).join(' | ');
for(let k=0;k<4;k++)console.log('same dom scan',k,p(L.scanJsdom(html,{},ro,dom).r));
console.log('fresh',p(L.scanJsdom(html,{},ro).r));
