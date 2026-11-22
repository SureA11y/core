process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const fs=require('fs');
const html=fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-shop.html','utf8');
const ROOTS={r8:'/home/user/core-r8',main:'/home/user/core',br:'/home/user/r12-contrast'};
const { chromium } = require('/home/user/r12-contrast/node_modules/playwright');
const ids=process.argv[2]?process.argv[2].split(','):['contrast-computable'];
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const res={};
 for(let rep=0;rep<9;rep++) for(const root of Object.keys(ROOTS)){
  const p=await b.newPage({viewport:{width:1280,height:800}});
  await p.setContent(html,{waitUntil:'load'});
  await p.addScriptTag({path:ROOTS[root]+'/surea11y.browser.js'});
  const ms=await p.evaluate(async(ids)=>{const t=performance.now();await window.a11ycore.runa11yCoreInPage(null,null,{},ids);return performance.now()-t},ids);
  await p.close(); (res[root]=res[root]||[]).push(ms);
 }
 const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
 for(const r in res) console.log('chrome',ids.join('+'),r.padEnd(5),'median',med(res[r]).toFixed(0),'ms  runs',res[r].map(x=>x.toFixed(0)).join(' '));
 await b.close();
 if(process.env.NOJS)return;
 for(const root of Object.keys(ROOTS)){ const T=require(ROOTS[root]+'/src/testing.js'); const W=console.warn;console.warn=()=>{}; const arr=[];
  for(let i=0;i<3;i++){const t=Date.now(); await T.runa11yCoreOnHtml(html,{runOnly:ids,entryPointParity:false}); arr.push(Date.now()-t);} console.warn=W;
  console.log('jsdom ',ids.join('+'),root.padEnd(5),'median',med(arr),'ms  runs',arr.join(' ')); }
})();
