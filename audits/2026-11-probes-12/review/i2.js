const H=require('/tmp/surea11y-audit/r12/api/h.js');
for(const role of ['navigation','menubar','tablist','group']){
const s=H.scan(H.page(`<ul role="${role}" aria-label=x><li><a href=#>a</a></li><li><a href=#>b</a></li></ul>`),{rules:{include:['listitem-parent-valid']}});
const c=s.r.checksResults.find(c=>c.ruleId==='listitem-parent-valid');const o=(c.occurrences||[])[0]||{};console.log(role,c.outcome,o.data&&o.data.details&&o.data.details.reasonCode,'|',o.hint);}
