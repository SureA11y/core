const {scan,close}=require('../../visual/h.js');
const L=['meta-viewport-zoom-enabled','meta-viewport-large'];
(async()=>{
 const metas=[['maximum-scale=abc'],['user-scalable=0.5'],['maximum-scale=-1'],['user-scalable=no','width=device-width'],['width=device-width user-scalable=no'],['maximum-scale=1.0'],['user-scalable=yes','user-scalable=no']];
 for (const m of metas){
  const head=m.map(c=>`<meta name="viewport" content="${c}">`).join('');
  const out=await scan(`<!doctype html><html lang=en><head><title>t</title>${head}</head><body><p>x</p></body></html>`,L);
  console.log(JSON.stringify(m).padEnd(50), out.map(o=>o.id.replace('meta-viewport-','')+'='+o.outcome+(o.occ[0]?' ('+o.occ[0].msg.slice(0,90)+')':'')).join(' | '));
 }
 await close();
})();
