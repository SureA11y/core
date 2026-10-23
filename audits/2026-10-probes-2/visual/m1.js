const h=require('./h');
(async()=>{
 for (const c of ['width=device-width, initial-scale=2','width=device-width initial-scale=2','initial-scale=2 maximum-scale=1.5','user-scalable=yes maximum-scale=5']) {
   const html=`<!doctype html><html lang="en"><head><title>Viewport probe</title><meta name="viewport" content="${c}"></head><body style="background:#fff"><p>Hello world</p></body></html>`;
   const p=await h.page(html,{ctx:{isMobile:true,hasTouch:true},viewport:{width:400,height:700}});
   const s=await p.evaluate(()=>[visualViewport.scale, innerWidth]);
   const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['meta-viewport-zoom-enabled']));
   console.log(JSON.stringify(c), 'scale/innerWidth', s, r.checksResults[0].outcome, JSON.stringify(r.checksResults[0].occurrences.map(o=>o.data&&o.data.details)));
   await p.close();
 }
 await h.close();
})();
