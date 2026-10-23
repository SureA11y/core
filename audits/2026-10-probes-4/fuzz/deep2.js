const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const open=process.argv[2], close=process.argv[3], rules=process.argv[5]?process.argv[5].split(','):null;
for(const n of process.argv[4].split(',').map(Number)){
 const html=`<!doctype html><html lang=en><head><title>t</title></head><body><main>${open.repeat(n)}x${close.repeat(n)}</main></body></html>`;
 const dom=createDom(html);const eo={perfStats:true,profileRules:true};const t=Date.now();
 const r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false,runOnly:rules?{includeRuleIds:rules}:null});
 const top=Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+'='+v.toFixed(0));
 console.log(n,'total',Date.now()-t,'warm',r.perfStats.warmUpMs.toFixed(0),top.join(' '));dom.window.close();}
