const {scan,tryit}=require('./h');
const html='<html lang=en><title>t</title><body><img src=a>';
const n=r=>r.checksResults.length+' checks';
const cases={
 'obj tags nonsense':[null,{tags:['nonsense']}],
 'obj includeRuleIds nope':[null,{includeRuleIds:['nope']}],
 'type tag nonsense':[null,{type:'tag',values:['nonsense']}],
 'type rule':[null,{type:'rule',values:['img-alt-present']}],
 'rules.include typo':[{rules:{include:'typo'}},null],
 'tags.include typo':[{tags:{include:['typo']}},null],
 '42':[null,42],'true':[null,true],'[]':[null,[]],"''":[null,''],'{}':[null,{}],
 'UPPER':[null,['IMG-ALT-PRESENT']],'bare typo':[null,['img-alt-presnt']],
 'mixed':[null,['img-alt-present','nope']],
};
for (const [k,[eo,ro]] of Object.entries(cases)) tryit(k,()=>n(scan(html,null,eo||{},ro)));
