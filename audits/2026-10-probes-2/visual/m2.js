const h=require('./h');
(async()=>{
   const html=`<!doctype html><html lang="en"><head><title>Viewport probe</title><meta name="viewport" content="initial-scale=2, maximum-scale=1.5"><meta name="viewport" content="width=device-width, initial-scale=2"></head><body style="background:#fff"><p>Hello world</p></body></html>`;
   const p=await h.page(html,{ctx:{isMobile:true,hasTouch:true},viewport:{width:400,height:700}});
   const s=await p.evaluate(()=>[visualViewport.scale, innerWidth]);
   const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['meta-viewport-zoom-enabled']));
   console.log('scale', s, r.checksResults[0].outcome);
 await h.close();
})();
