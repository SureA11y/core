const {page,close}=require('../../visual/h.js');
(async()=>{
 for (const n of [500,1000,2000,3000,6000]){
  let h='<div style="white-space:nowrap;width:100000px">'; for(let i=0;i<n;i++) h+=`<span>w${i} </span>`; h+='</div>';
  const p=await page(h,{viewport:{width:800,height:600}});
  const t=await p.evaluate(()=>Promise.resolve(a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true},['text-spacing-content-loss'])).then(r=>[Math.round(r.perfStats.ruleTimings['text-spacing-content-loss']),r.checksResults.find(x=>x.ruleId==='text-spacing-content-loss').outcome]));
  console.log('one band, n=',n,t); await p.close();
 }
 await close();
})();
