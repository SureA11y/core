// button-name-present time for one button whose aria-labelledby lists N ids (Chromium, median of 3).
const C=require('./chrome-lib.js');const L=require('./lib.js');
(async()=>{const b=await C.launch();
for(const N of [1000,2500,5000,10000,20000]){let ids='',s='';for(let i=0;i<N;i++){s+=`<span id="s${i}">w${i}</span>`;ids+='s'+i+' ';}
const html=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}<button aria-labelledby="${ids}"></button></main></body></html>`;const ts=[];
for(let k=0;k<3;k++){const p=await b.newPage();await p.setContent(html);await C.inject(p);ts.push(await p.evaluate(()=>{const t=performance.now();window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['button-name-present']});return performance.now()-t}));await p.close();}
console.log(JSON.stringify({N,ms:Math.round(L.median(ts))}));}
await b.close();})();
