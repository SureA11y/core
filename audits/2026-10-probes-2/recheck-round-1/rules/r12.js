const {scan,show,close}=require('../../visual/h.js');
(async()=>{
 const doc=(cs)=>`<!doctype html><html lang="en" style="color-scheme:${cs}"><head><title>t</title></head><body><p style="color:#bbb">Some light text here</p></body></html>`;
 for (const cs of ['dark','light']) for (const mode of [undefined,'auditorAssist']){
  const out=await scan(doc(cs),['contrast-minimum','contrast-computable'],{engineOptions: mode?{contrast:{mode}}:{}});
  show(`color-scheme:${cs} mode=${mode}`,out);
 }
 await close();
})();
