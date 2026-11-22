const H=require('/tmp/surea11y-audit/r12/api/h.js');
const rule={id:'x-sel',meta:{title:'x',tags:['wcag2a','wcag111'],wcagSc:['1.1.1']},runInPage(ctx){return{ruleId:ctx.rule.ruleId,outcome:'fail',severity:'serious',occurrences:[{selector:'p.t',outcome:'fail',summary:'s'}]}}};
const html=H.page('<div id=ad><p class=t>a</p></div><section id=ctx><p class=t>b</p></section><p class=t>c</p>');
for(const [n,eo,extra] of [['excl ad',{customRules:[rule],excludeSelectors:['#ad'],rules:{include:['x-sel']}},{}],
  ['excl ad, context #ctx',{customRules:[rule],excludeSelectors:['#ad'],rules:{include:['x-sel']}},{contextSelector:'#ctx'}],
  ['excl all three',{customRules:[rule],excludeSelectors:['#ad','#ctx','main > p'],rules:{include:['x-sel']}},{}]]){
 const s=H.scan(html,eo,null,extra);const c=s.err?{err:s.err.message}:s.r.checksResults.find(c=>c.ruleId==='x-sel');
 console.log(n,'|',JSON.stringify({o:c.outcome,n:(c.occurrences||[]).length,err:c.error||c.err,st:c.status}).slice(0,400),s.logs.slice(0,2));}
