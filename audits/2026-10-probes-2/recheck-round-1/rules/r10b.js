const {page,close}=require('../../visual/h.js');
(async()=>{
 for (const h of [19,18,17.5,17,16]){
 const p=await page(`<div style="width:400px;height:${h}px;overflow:hidden;font-size:16px;line-height:18px"><p style="margin:0">Short text here</p></div>`);
 const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['text-spacing-content-loss']));
 const c=r.checksResults.find(x=>x.ruleId==='text-spacing-content-loss');
 console.log('box h',h,c.outcome,(c.occurrences||[]).map(o=>o.data&&JSON.stringify(o.data.details&&o.data.details.metrics||o.data.metrics)).join(), JSON.stringify(c.margin&&{v:c.margin.value,t:c.margin.threshold,h:c.margin.headroom}));
 await p.close();}
 await close();
})();
