const fs=require('fs'),http=require('http');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const {chromium}=require('/home/user/r12-review/node_modules/playwright');
const T={main:'/home/user/core',now:'/home/user/r12-review',v117:'/home/user/core-v117'};
const B=Object.fromEntries(Object.entries(T).map(([k,v])=>[k,fs.readFileSync(v+'/surea11y.browser.js','utf8')]));
const pages=(process.env.PAGES||'shop,news,forms,blog').split(',');const reps=+process.env.REPS||3,N=+process.env.N||15;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1280,height:900}});
 const res={};
 for(const pg of pages){const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');
  for(let r=0;r<reps;r++)for(const t of Object.keys(T)){const p=await ctx.newPage();await p.setContent(html);await p.addScriptTag({content:B[t]});
   const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const m=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
   const a=await m();await p.evaluate(()=>{a11ycore.runa11yCoreInPage(null,null,{},null);return 1});const z=await m();
   (res[pg+' '+t]=res[pg+' '+t]||[]).push(Math.round((z.TaskDuration-a.TaskDuration)*1000));await p.close();}}
 for(const k in res){const v=res[k].sort((a,b)=>a-b);console.log(k.padEnd(14),'cpu ms median',v[v.length>>1],JSON.stringify(v));}
 // leak: N scans in one page
 const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+(process.env.LEAK||'shop')+'.html','utf8');
 for(const t of Object.keys(T)){const p=await ctx.newPage();await p.setContent(html);await p.addScriptTag({content:B[t]});const cdp=await ctx.newCDPSession(p);
  const heap=async()=>{await cdp.send('HeapProfiler.collectGarbage');return (await p.evaluate(()=>performance.memory.usedJSHeapSize))/1e6};
  await p.evaluate(()=>a11ycore.runa11yCoreInPage(null,null,{},null)&&1);const h1=await heap();
  for(let i=0;i<N;i++)await p.evaluate(()=>a11ycore.runa11yCoreInPage(null,null,{},null)&&1);const h2=await heap();
  const proto=await p.evaluate(()=>Object.getOwnPropertyNames(Object.prototype).length);
  console.log('leak',t,'heap after 1:',h1.toFixed(1),'MB after',N+1,':',h2.toFixed(1),'MB; Object.prototype keys',proto);await p.close();}
 await b.close();})();
