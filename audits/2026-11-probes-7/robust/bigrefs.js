// An input whose aria-describedby names N ids: size of each occurrence field; time of button-name-present for an aria-labelledby of N ids.
const L=require('./lib.js');console.warn=()=>{};
const N=+(process.argv[2]||20000);
let ids='',s='';for(let i=0;i<N;i++){s+=`<span id="s${i}">w${i}</span>`;ids+='s'+i+' ';}
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}<button aria-labelledby="${ids}"></button><input aria-describedby="${ids}"></main></body></html>`;
const t=Date.now();const {r}=L.scanJsdom(html,{perfStats:true,profileRules:true});
for(const c of r.checksResults)for(const o of c.occurrences){const sizes={summary:o.summary.length,hint:o.hint.length,html:(o.html||'').length,selector:o.selector.length,data:JSON.stringify(o.data||{}).length,i18n:JSON.stringify(o.i18n||{}).length,lean:JSON.stringify(o.lean||{}).length,howToCheck:JSON.stringify(o.howToCheck||{}).length};if(Object.values(sizes).some(v=>v>5000))console.log(c.ruleId,JSON.stringify(sizes),o.summary.slice(0,200));}
console.log('N',N,'ms',Date.now()-t,'button-name-present',Math.round(r.perfStats.ruleTimings['button-name-present']),'ms');
