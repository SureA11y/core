const {scan,tryit}=require('./h');
const circ={a:1};circ.self=circ;
const deep={};let d=deep;for(let i=0;i<20000;i++){d.n={};d=d.n;}
const getter={};Object.defineProperty(getter,'x',{enumerable:true,get(){throw new Error('boom')}});
const rule={id:'my-rule',meta:{title:'t',description:'d',tags:['custom'],defaultSeverity:'minor',defaultConfidence:'high',type:'automatic'},runInPage(ctx){return {outcome:'pass',occurrences:[]};}};
const html='<html lang=en><title>t</title><body><p>x</p>';
for (const [lab,eo] of [['circ',{probes:circ}],['bigint',{probes:{b:1n}}],['getter',{probes:getter}],['deep',{probes:deep}],['fnRule',{customRules:[rule]}]]) {
  tryit(lab, ()=>{const r=scan(html,null,eo,(eo.customRules?['img-alt-present','my-rule']:['img-alt-present'])); let s='';try{JSON.stringify(r);s+='json ok;'}catch(e){s+='json THROW '+e.message+';'} try{structuredClone(r);s+='clone ok;'}catch(e){s+='clone THROW '+e.message.slice(0,80)} s+=' echo='+JSON.stringify(r.checksResults[0].engineOptions).slice(0,150); return s;});
}
// big pageTitles
const big={crawl:{pageTitles:Array.from({length:250000},(_, i)=>'Title number '+i+' xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}};
tryit('big', ()=>{const r=scan(html,null,{probes:big});const s=JSON.stringify(r);return 'len '+s.length+' checks '+r.checksResults.length;});
