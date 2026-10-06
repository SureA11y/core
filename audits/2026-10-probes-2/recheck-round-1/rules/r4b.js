const {page,close}=require('../../visual/h.js');
(async()=>{
 for (const [n,wrap] of [[10000,1],[20000,1],[40000,1],[40000,0]]){
  let h=''; for(let i=0;i<n;i++) h+= wrap?`<div><p style="color:#000">t${i}</p></div>`:`<p style="color:#000">t${i}</p>`;
  const p=await page(h);
  const r=await p.evaluate(()=>{const t=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true},['contrast-minimum']);return Promise.resolve(r).then(r=>({r,t:performance.now()-t}))});
  console.log('R-4',n,wrap?'wrapped':'siblings', Math.round(r.r.perfStats.ruleTimings['contrast-minimum']), 'total',Math.round(r.t), JSON.stringify(Object.fromEntries(Object.entries(r.r.perfStats).filter(([k,v])=>typeof v==='number'))).slice(0,300));
  await p.close();
 }
 await close();
})();
