const {scan,tryit}=require('./h');
const B=require('/home/user/core/src/baseline.js');
const S=require('/home/user/core/src/sarif.js');
const p1='<html><head><title>t</title></head><body><main><h2>x</h2><img src="a.png" class="b a"></main></body></html>';
const p2='<html><head><title>t</title></head><body><main><h2>x</h2><p>unrelated</p><img class="a b" src="a.png"></main></body></html>';
const r1=scan(p1), r2=scan(p2);
const lang=r1.checksResults.find(c=>c.ruleId==='html-lang-attr-present');
console.log('lang html:',JSON.stringify(lang.occurrences.map(o=>o.html)));
for (const id of ['bypass-blocks-present','landmark-one-main','page-has-heading-one']){const c=r1.checksResults.find(c=>c.ruleId===id);console.log(id,c.outcome,JSON.stringify(c.occurrences.map(o=>o.html)));}
const base=B.buildBaselineEntries(r1);
const m=B.matchBaseline(r2,base);
console.log('match:',JSON.stringify({newCount:m.newCount,staleCount:m.staleCount,known:m.knownCount, keys:Object.keys(m)}));
// SARIF fingerprints
const s1=S.renderSarifReport(r1), s2=S.renderSarifReport(r2);
const fp=s=>{const j=typeof s==='string'?JSON.parse(s):s;return j.runs[0].results.map(r=>r.ruleId+'|'+JSON.stringify(r.partialFingerprints).slice(0,90))};
const a=fp(s1),b=fp(s2);console.log('sarif fps differ:',a.filter(x=>!b.includes(x)));
console.log('sample fp', a[0]);
