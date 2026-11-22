const fs=require('fs');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const {chromium}=require('/home/user/r12-review/node_modules/playwright');const T={main:'/home/user/core',now:'/home/user/r12-review'};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext();
for(const pg of ['shop','forms'])for(const t in T){const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');const v=[];
 for(let i=0;i<3;i++){const p=await ctx.newPage();await p.setContent(html);await p.addScriptTag({content:fs.readFileSync(T[t]+'/surea11y.browser.js','utf8')});const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');
  const m=async()=>(await cdp.send('Performance.getMetrics')).metrics.find(x=>x.name==='TaskDuration').value;const a=await m();
  await p.evaluate(()=>a11ycore.runa11yCoreInPage(null,null,{rules:{include:['css-focus-indicator-suppressed']}},null)&&1);v.push(Math.round((await m()-a)*1000));await p.close();}
 console.log(pg,t,'css-focus alone cpu ms',v.join(' '));}
await b.close();})();
