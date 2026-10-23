const {launch,serve}=require('./lib.cjs'); const fs=require('fs');
const XF=fs.readFileSync('proj/xf.bundle.js','utf8');
const GIF=Buffer.from('R0lGODlhAQABAAAAACw=','base64');
const pg=`<!doctype html><html><head><script src="/xf.js"></script></head><body><img src="/slow.gif"><img src="/hang.gif" loading="lazy"><img src="/hang.gif?2"><div id="m"></div><script>setInterval(()=>{document.getElementById('m').textContent=Date.now()},50)</script></body></html>`;
(async()=>{ const {server,base}=await serve({'/xf.js':{body:XF,headers:{'content-type':'text/javascript'}},'/p':{body:pg},'/slow.gif':{delay:1500,body:GIF,headers:{'content-type':'image/gif'}},'/hang.gif':{hang:true}});
 const b=await launch(); const page=await b.newPage();
 await page.goto(base+'/p',{waitUntil:'commit'}); await page.waitForFunction(()=>window.X);
 for (const o of [{timeoutMs:0},{timeoutMs:300},{timeoutMs:2500},{timeoutMs:1000,quietMs:200},{timeoutMs:-5},{timeoutMs:'abc'},{timeoutMs:NaN},{quietMs:-1,timeoutMs:200},{timeoutMs:Infinity,quietMs:100}]){
  const t=Date.now(); const r=await Promise.race([page.evaluate(o=>X.waitForPageReady(o),o), new Promise(r=>setTimeout(()=>r('NO RESOLVE in 8s'),8000))]); console.log(JSON.stringify(o),'->',Date.now()-t,'ms',JSON.stringify(r));
 }
 // document option with iframe doc and bogus
 console.log('bogus document', JSON.stringify(await page.evaluate(()=>X.waitForPageReady({document:{} ,timeoutMs:100}))));
 console.log('null opts', JSON.stringify(await page.evaluate(()=>X.waitForPageReady(null))));
 await b.close(); server.close(); process.exit(0); })();
