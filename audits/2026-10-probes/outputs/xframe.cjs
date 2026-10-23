const {launch,serve}=require('./lib.cjs'); const fs=require('fs');
const XF=fs.readFileSync('proj/xf.bundle.js','utf8');
const S='<script src="/xf.js"></script>';
const child=`<!doctype html><html lang="en"><head><title>child</title>${S}<script>X.a11yCoreEnableFrameResponder()</script></head><body><img src="c.png"><iframe src="/grand" title="g"></iframe></body></html>`;
const grand=`<!doctype html><html><head>${S}<script>X.a11yCoreEnableFrameResponder()</script></head><body><button></button></body></html>`;
const silent=`<!doctype html><html><head><title>s</title></head><body><a href="/q"></a></body></html>`;
const srcdoc=`<!doctype html><html><head><script src='/xf.js'></script><script>X.a11yCoreEnableFrameResponder()</script></head><body><input></body></html>`.replace(/"/g,'&quot;');
const parent=`<!doctype html><html lang="en"><head><title>P</title>${S}</head><body><main><h1>P</h1>
<iframe src="/child" title="same-origin"></iframe>
<iframe srcdoc="${srcdoc}" title="srcdoc"></iframe>
<iframe src="/silent" title="silent"></iframe>
<iframe src="/hang" title="hang"></iframe>
<iframe src="about:blank" title="blank"></iframe>
</main></body></html>`;
(async()=>{ const {server,base}=await serve({'/xf.js':{body:XF,headers:{'content-type':'text/javascript'}},'/p':{body:parent},'/child':{body:child},'/grand':{body:grand},'/silent':{body:silent},'/hang':{hang:true}});
 const b=await launch(); const page=await b.newPage(); page.on('pageerror',e=>console.log('ERR',e.message));
 await page.goto(base+'/p',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1500);
 for (const opts of [{}, {pingWaitTime:100}]){
 const t=Date.now();
 const r=await page.evaluate(async(o)=>{ const res=await X.runa11yCoreAcrossFrames(location.href,null,o,null); const sum=(n)=>({url:n.url, err:n.error, fails:n.topFrame?n.topFrame.checksResults.filter(c=>c.outcome==='fail').map(c=>c.ruleId):undefined, frames:(n.frames||[]).map(sum)}); return {top:res.topFrame.checksResults.filter(c=>c.outcome==='fail').map(c=>c.ruleId), frames:res.frames.map(sum), bytes:JSON.stringify(res).length}; }, opts);
 console.log('opts',JSON.stringify(opts),'ms',Date.now()-t); console.log(JSON.stringify(r,null,1).slice(0,2500));
 }
 // waitForPageReady
 const wp=await b.newPage(); await wp.goto(base+'/p',{waitUntil:'commit'});
 await serve; 
 await b.close(); server.close(); })();
