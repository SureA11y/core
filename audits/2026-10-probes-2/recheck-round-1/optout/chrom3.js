const http=require('http');const fs=require('fs');
const {chromium}=require('/home/user/core/node_modules/playwright');
const bundle=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
const xb=fs.readFileSync(__dirname+'/xf-bundle.js','utf8');
const runjs=`window.__res=(function(){try{const rule={id:'str-rule',meta:{title:'S',description:'d',tags:['custom'],defaultSeverity:'minor',defaultConfidence:'high',type:'automatic'},runInPage:"function(ctx){return {outcome:'pass',occurrences:[]};}"};const r=a11ycore.runa11yCoreInPage(location.href,null,{customRules:[rule]},null);return JSON.stringify({ids:r.checksResults.filter(c=>c.ruleId==='str-rule').map(c=>c.outcome),skipped:r.skippedCustomRules});}catch(e){return 'THROW '+e.message}})();`;
const pages={
 '/csp.html':{csp:"script-src 'self'",body:`<html lang=en><head><title>t</title><script src="/b.js"></script><script src="/run.js"></script></head><body><img src="x.png"></body></html>`},
 '/nocsp.html':{body:`<html lang=en><head><title>t</title><script src="/b.js"></script><script src="/run.js"></script></head><body><img src="x.png"></body></html>`},
 '/frames.html':{body:`<html lang=en><head><title>t</title><script src="/x.js"></script></head><body><main><p>x</p><iframe id=f1 title="one" src="/child.html"></iframe><iframe id=f2 title="dead" src="http://localhost:PORT/silent.html"></iframe><iframe id=f4 title=slow src="/slow.html"></iframe><iframe id=f3 title="three" src="/child.html?2"></iframe></main></body></html>`},
 '/child.html':{body:`<html lang=en><head><title>c</title><script src="/x.js"></script><script>xcore.a11yCoreEnableFrameResponder()</script></head><body><img src=y.png></body></html>`},
 '/silent.html':{body:`<html lang=en><head><title>s</title></head><body><p>no engine</p></body></html>`},
};
const srv=http.createServer((q,s)=>{const u=q.url.split('?')[0];if(u==='/b.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end(bundle);}if(u==='/x.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end(xb);}if(u==='/run.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end(runjs);} if(u==='/slow.html'){return setTimeout(()=>{s.writeHead(200,{'content-type':'text/html'});s.end('<p>slow')},5000);} const p=pages[u];if(!p){s.writeHead(404);return s.end();}
 const h={'content-type':'text/html'};if(p.csp)h['content-security-policy']=p.csp;s.writeHead(200,h);s.end(p.body.replace('PORT',srv.address().port));});
srv.listen(0,async()=>{const base='http://127.0.0.1:'+srv.address().port;
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
 const logs=[];pg.on('console',m=>logs.push(m.type()+': '+m.text().slice(0,220)));
 for (const p of []){logs.length=0;await pg.goto(base+p);const r=await pg.evaluate(()=>window.__res);console.log('O-7',p,r,JSON.stringify(logs.slice(0,3)));}
 await pg.goto(base+'/frames.html');await pg.waitForTimeout(800);
 const xf=await pg.evaluate(async()=>{const r=await xcore.runa11yCoreAcrossFrames(location.href,null,{frameWaitTime:1000,pingWaitTime:1000},['img-alt-present']);const walk=n=>{const o={};for(const k of Object.keys(n)){if(k==='frames')o.frames=n.frames.map(walk);else if(k==='topFrame')o.topFrame=n.topFrame?{url:n.topFrame.url,keys:Object.keys(n.topFrame).length}:null;else o[k]=n[k];}return o;};return walk(r);}).catch(e=>'ERR '+e.message);
 console.log('O-13',JSON.stringify(xf));
 await br.close();srv.close();});
