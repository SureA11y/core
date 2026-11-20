// The hint of form-control-programmatic-label-present for a field whose aria-describedby names N ids.
const L=require('./lib.js');console.warn=()=>{};
const N=+(process.argv[2]||50);
let ids='',s='';for(let i=0;i<N;i++){s+=`<span id="s${i}">w${i}</span>`;ids+='s'+i+' ';}
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}<input aria-describedby="${ids}"></main></body></html>`;
const {r}=L.scanJsdom(html,{},{includeRuleIds:['form-control-programmatic-label-present']});
const o=r.checksResults[0].occurrences[0];console.log('N',N,'hint chars',o.hint.length,'i18n params chars',JSON.stringify(o.i18n.params).length);console.log(o.hint.slice(0,400));console.log(Object.keys(o.i18n.params));
