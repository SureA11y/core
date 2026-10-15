const {contrastRun,report}=require('./ch.js');const {close}=require('./h.js');
const T='Sample text here';
(async()=>{
 const eo={contrast:{mode:'auditorAssist'}};
 for(const [label,attr,meta,scheme] of [
  ['root dark','color-scheme:dark','', 'light'],
  ['root light dark, pref dark','color-scheme:light dark','', 'dark'],
  ['root light dark, pref light','color-scheme:light dark','', 'light'],
  ['root dark light, pref light','color-scheme:dark light','', 'light'],
  ['root only dark','color-scheme:only dark','', 'light'],
  ['meta light dark, pref dark','','<meta name=color-scheme content="light dark">','dark'],
  ['meta dark, pref light','','<meta name=color-scheme content="dark">','light'],
  ['body dark only','','', 'light','body'],
 ]){
  const html=`<!doctype html><html lang=en style="${arguments.length&&attr}"><head><title>c</title>${meta}</head><body ${label==='body dark only'?'style="color-scheme:dark"':''}><main><p data-t id=a>${T}</p><p data-t id=b style="color:#666">${T}</p><p data-t id=c style="color:#aaa">${T}</p></main></body></html>`;
  const r=await contrastRun(html,{colorScheme:scheme,eo});
  const ex={};for(const id of ['a','b','c']){const g=r.gt[id];ex[id]=g.ratio>=4.5?'pass':'fail';}
  console.log(report(label+' [auditorAssist]',r,ex));
 }
 await close();
})();
