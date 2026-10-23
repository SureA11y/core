const http=require('http');const fs=require('fs');
const {chromium}=require('/home/user/core/node_modules/playwright');
const bundle=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
const pages={
 '/csp.html':{csp:"script-src 'self'",body:`<html lang=en><head><title>t</title><script src="/b.js"></script></head><body><img src="x.png"></body></html>`},
 '/nocsp.html':{body:`<html lang=en><head><title>t</title><script src="/b.js"></script></head><body><img src="x.png"></body></html>`},
 '/frames.html':{body:`<html lang=en><head><title>t</title><script src="/b.js"></script></head><body><main><p>x</p><iframe id=f1 title="one" src="/child.html"></iframe><iframe id=f2 title="dead" src="/silent.html"></iframe><iframe id=f3 title="three" src="/child.html"></iframe></main></body></html>`},
 '/child.html':{body:`<html lang=en><head><title>c</title><script src="/b.js"></script><script>a11ycore.a11yCoreEnableFrameResponder()</script></head><body><img src=y.png></body></html>`},
 '/silent.html':{body:`<html lang=en><head><title>s</title></head><body><p>no engine</p></body></html>`},
 '/plain.html':{body:`<html lang=en><head><title>t</title><script src="/b.js"></script></head><body><p>Hello world text</p><p style="color:#777">Grey</p></body></html>`},
};
const srv=http.createServer((q,s)=>{const u=q.url.split('?')[0];if(u==='/b.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end(bundle);} const p=pages[u];if(!p){s.writeHead(404);return s.end();}
 const h={'content-type':'text/html'};if(p.csp)h['content-security-policy']=p.csp;s.writeHead(200,h);s.end(p.body);});
srv.listen(0,async()=>{const base='http://127.0.0.1:'+srv.address().port;
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
 const logs=[];pg.on('console',m=>logs.push(m.type()+': '+m.text().slice(0,200)));
 const ruleSrc=`({id:'str-rule',meta:{title:'S',description:'d',tags:['custom'],defaultSeverity:'minor',defaultConfidence:'high',type:'automatic'},runInPage:"function(ctx){return {outcome:'pass',occurrences:[]};}"})`;
 for (const p of ['/nocsp.html','/csp.html']){logs.length=0;await pg.goto(base+p);
  const r=await pg.evaluate((src)=>{const rule=eval(src);try{const res=a11ycore.runa11yCoreInPage(location.href,null,{customRules:[rule]},null);return {ids:res.checksResults.filter(c=>c.ruleId==='str-rule').map(c=>c.outcome),skipped:res.skippedCustomRules};}catch(e){return 'THROW '+e.message}},ruleSrc).catch(e=>'EVALERR '+e.message.slice(0,200));
  console.log('O-7',p,JSON.stringify(r),logs.filter(l=>/surea11y|CSP|eval/i.test(l)).slice(0,3));}
 // O-13
 await pg.goto(base+'/frames.html');await pg.waitForTimeout(500);
 const xf=await pg.evaluate(async()=>{const r=await a11ycore.runa11yCoreAcrossFrames(location.href,null,{frameWaitTime:800,pingWaitTime:800},['img-alt-present']);const walk=n=>({keys:Object.keys(n).filter(k=>k!=='topFrame'&&k!=='frames'),url:n.url,topUrl:n.topFrame&&n.topFrame.url,frameEl:n.frameElement||n.frame||n.iframe||n.selector||null,frames:(n.frames||[]).map(walk)});return walk(r);}).catch(e=>'ERR '+e.message);
 console.log('O-13',JSON.stringify(xf,null,0));
 // S-8 & no-background
 await pg.goto(base+'/plain.html');
 const c=await pg.evaluate(()=>{const r=a11ycore.runa11yCoreInPage(location.href,null,{},['contrast-minimum','contrast-computable','contrast-enhanced']);return r.checksResults.map(c=>c.ruleId+':'+c.outcome+':occ='+c.occurrences.length+':sel='+JSON.stringify(c.occurrences[0]&&c.occurrences[0].selector));});
 console.log('S-8/chromium',c);
 await br.close();srv.close();});
