// moving-content-pausable in Chromium on its fixture vs the mutated copy, scanned right after setContent and after a delay.
const C=require('./chrome-lib.js');const fs=require('fs');
(async()=>{const b=await C.launch();
for(const [n,f] of [['orig','/home/user/core-r8/tests/fixtures/moving-content-pausable-all-scenarios.html'],['mut','out/mut104.html']]){
 for(const delay of [0,500]){const p=await b.newPage();await p.setContent(fs.readFileSync(f,'utf8'));await C.inject(p);if(delay)await p.waitForTimeout(delay);
 const r=await C.scan(p,{},{includeRuleIds:['moving-content-pausable']});const c=r.checksResults[0];console.log(n,delay,c.outcome,c.occurrences.map(o=>o.selector+':'+o.data.details.reasonCode).join(','));await p.close();}}
await b.close();})();
