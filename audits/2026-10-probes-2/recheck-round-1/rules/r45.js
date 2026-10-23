const {page,close}=require('../../visual/h.js');
(async()=>{
 // R-5
 let html='';for(let i=0;i<60;i++)html+=`<p style="color:#ccc">fail ${i}</p>`; html+='<p style="color:#757575">passing near threshold</p><p style="color:#555">enh pass</p>';
 for (const rule of ['contrast-minimum','contrast-enhanced']){
 const p=await page(html);
 const r=await p.evaluate((rule)=>a11ycore.runa11yCoreInPage(location.href,null,{},[rule]),rule);
 const c=r.checksResults.find(x=>x.ruleId===rule);
 console.log('R-5',rule,c.outcome,c.occurrences.length,JSON.stringify(c.margin));
 await p.close();}
 // R-4
 for (const [n,wrap] of [[10000,0],[20000,0],[40000,0],[40000,1]]){
  let h=''; for(let i=0;i<n;i++) h+= wrap?`<div><p style="color:#000">t${i}</p></div>`:`<p style="color:#000">t${i}</p>`;
  const p=await page(h);
  const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true},['contrast-minimum']));
  const c=r.checksResults.find(x=>x.ruleId==='contrast-minimum');
  console.log('R-4',n,wrap?'wrapped':'siblings',c.outcome, JSON.stringify(r.perfStats&&r.perfStats.ruleTimings&&r.perfStats.ruleTimings['contrast-minimum']), c.margin&&c.margin.measuredCount);
  await p.close();
 }
 await close();
})();
