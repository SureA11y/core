const {run,summ}=require('./h.js');
const setup=(doc)=>{ const h=doc.getElementById('host'); const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<div class="inner"><img src="s.png"><button></button><div id="h2"></div></div>'; const sr2=sr.getElementById('h2').attachShadow({mode:'open'}); sr2.innerHTML='<img src="deep.png"><slot></slot>'; sr.getElementById('h2').innerHTML='<img src="slotted.png">'; };
const f=(x)=>{ if(x.err) return 'THROW code='+(x.err.code||'-')+' '+x.err.message.slice(0,140); const img=x.r.checksResults.find(c=>c.ruleId==='img-alt-present'); const btn=x.r.checksResults.find(c=>c.ruleId==='button-name-present'); return `${JSON.stringify(summ(x.r).o)} img=${img&&img.outcome}:${img?img.occurrences.map(o=>o.selector).join(';'):''} btn=${btn&&btn.outcome}/${btn?btn.occurrences.length:0} ${x.warns.length?'WARN:'+x.warns.join('|').slice(0,140):''}`;};
const cases={
 base:{}, noShadow:{eo:{includeShadowDom:false}},
 exA:{eo:{excludeSelectors:['#a']}}, exStr:{eo:{excludeSelectors:'#a, #host'}},
 exInvalid:{eo:{excludeSelectors:['#a[']}}, exInvalidMixed:{eo:{excludeSelectors:['#a[','#b']}},
 exBody:{eo:{excludeSelectors:['body']}}, exHtml:{eo:{excludeSelectors:['html']}}, exStar:{eo:{excludeSelectors:'*'}},
 exShadowInner:{eo:{excludeSelectors:['.inner']}}, exHost:{eo:{excludeSelectors:['#host']}},
 exNum:{eo:{excludeSelectors:5}},
 ruleEx:{eo:{rules:{'img-alt-present':{excludeSelectors:['#a']}}}},
 ruleExInvalid:{eo:{rules:{'img-alt-present':{excludeSelectors:['#a[']}}}},
 ruleExAll:{eo:{rules:{'img-alt-present':{excludeSelectors:'img'}}}},
 ruleExAndInclude:{eo:{rules:{include:'img-alt-present','img-alt-present':{excludeSelectors:'img'}}}},
 ruleExWithRO:{eo:{rules:{'img-alt-present':{excludeSelectors:['#a']}}},ro:['img-alt-present']},
 ctxPlusExSame:{ctx:'#a',eo:{excludeSelectors:['#a']}},
 hiddenInc:{eo:{includeHiddenElements:true}},
 hiddenStr:{eo:{includeHiddenElements:'true'}},
 fragment:{eo:{fragment:true}},
};
for(const [k,c] of Object.entries(cases)) console.log(k.padEnd(16), f(run({...c,setup})));
