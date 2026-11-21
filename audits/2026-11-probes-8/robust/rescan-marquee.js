// Chromium rescans of fuzz pages that differed: with <marquee> as is, and with marquee renamed to div.
const C=require('./chrome-lib.js');const G=require('./gen.js');const L=require('./lib.js');
(async()=>{const b=await C.launch();
for(const i of [40,41,82,94,102,138]){const h0=G.make(i,{budget:40+(i%7)*40,maxDepth:4+(i%9)});
 for(const [label,h] of [['marquee',h0],['no-marquee',h0.replace(/<(\/?)marquee/g,'<$1div')]]){let diffs=0;
  for(let k=0;k<3;k++){const p=await b.newPage();await p.setContent(h).catch(()=>{});await C.inject(p);
   const a=JSON.stringify(L.project(await C.scan(p,{},{includeRuleIds:['contrast-computable','contrast-minimum']})));await p.waitForTimeout(150);
   const c=JSON.stringify(L.project(await C.scan(p,{},{includeRuleIds:['contrast-computable','contrast-minimum']})));if(a!==c)diffs++;await p.close();}
  console.log('gen'+i,label,'rescans that differ:',diffs,'/3');}}
await b.close();})();
