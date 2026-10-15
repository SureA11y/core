const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const tag=process.argv[2]||'div', inner=process.argv[3]||'x';
for(const n of (process.argv[4]||'100,200,400,800').split(',').map(Number)){
 const html=`<!doctype html><html lang=en><head><title>t</title></head><body><main>${`<${tag}>`.repeat(n)}${inner}${`</${tag}>`.repeat(n)}</main></body></html>`;
 const dom=createDom(html);const eo={perfStats:true,profileRules:true};const t=Date.now();let r;
 try{r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false});}catch(e){console.log(n,'THROW',e.message.slice(0,200));continue}
 const tot=Date.now()-t;const top=Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+'='+v.toFixed(0));
 const errs=r.checksResults.filter(c=>c.error).map(c=>c.ruleId+':'+String(c.error).slice(0,80));
 console.log(n,'total',tot,'warm',r.perfStats.warmUpMs.toFixed(0),top.join(' '),errs.length?'ERR '+errs.join(';'):'');dom.window.close();}
