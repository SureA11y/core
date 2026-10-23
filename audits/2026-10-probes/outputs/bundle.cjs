const {launch,serve}=require('./lib.cjs'); const fs=require('fs');
const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8'); const DE=fs.readFileSync('/home/user/core/surea11y.i18n.de.js','utf8'); const JA=fs.readFileSync('/home/user/core/surea11y.i18n.ja.js','utf8');
const pg=`<!doctype html><html lang="en"><head><title>B</title></head><body><main><img src="a.png"><button></button></main></body></html>`;
const pgCsp=pg.replace('<head>','<head>');
(async()=>{ const {server,base}=await serve({'/p':{body:pg},'/csp':{body:pg,headers:{'content-type':'text/html','content-security-policy':"script-src 'self' 'nonce-abc'"}},'/b.js':{body:BUNDLE,headers:{'content-type':'text/javascript'}},'/de.js':{body:DE,headers:{'content-type':'text/javascript'}},'/ja.js':{body:JA,headers:{'content-type':'text/javascript'}},
 '/csppage':{body:pg.replace('</body>','<script src="/b.js"></script><script src="/de.js"></script><script src="/run.js"></script></body>'),headers:{'content-type':'text/html','content-security-policy':"script-src 'self'"}},
 '/run.js':{headers:{'content-type':'text/javascript'},body:`
 window.__out={};
 try{ const r=a11ycore.runa11yCoreInPage(location.href,null,{locale:'de'},null); window.__out.basic={fails:r.checksResults.filter(c=>c.outcome==='fail').map(c=>c.ruleId), title:r.checksResults.find(c=>c.ruleId==='img-alt-present').title, locale:r.engine.locale}; }catch(e){window.__out.basicErr=e.message}
 try{ const r=a11ycore.runa11yCoreInPage(location.href,null,{customRules:[{id:'c-str',meta:{title:'t',description:'d'},runInPage:"function(ctx){return {outcome:'fail',occurrences:[{__node:document.body,summary:'s',hint:'h'}]};}"}]},null); const c=r.checksResults.find(c=>c.ruleId==='c-str'); window.__out.customStr=c?c.outcome+' '+(c.error||''):'MISSING'; }catch(e){window.__out.customStrErr=e.message}
 try{ const r=a11ycore.runa11yCoreInPage(location.href,null,{customRules:[{id:'c-fn',meta:{title:'t',description:'d'},runInPage:function(ctx){return {outcome:'fail',occurrences:[{__node:document.body,summary:'s',hint:'h'}]};}}]},null); const c=r.checksResults.find(c=>c.ruleId==='c-fn'); window.__out.customFn=c?c.outcome+' '+(c.error||''):'MISSING'; }catch(e){window.__out.customFnErr=e.message}
 `}});
 const b=await launch(); const page=await b.newPage(); const msgs=[]; page.on('console',m=>msgs.push(m.type()+': '+m.text().slice(0,200))); page.on('pageerror',e=>msgs.push('pageerror: '+e.message));
 await page.goto(base+'/p'); await page.addScriptTag({content:BUNDLE});
 console.log('globals', await page.evaluate(()=>Object.keys(window).filter(k=>/a11y|surea/i.test(k)).join(',')+' | '+Object.keys(window.a11ycore).join(',')));
 const en=await page.evaluate(()=>{const r=a11ycore.runa11yCoreInPage(location.href,null,{locale:'de'},null); return {locale:r.engine.locale,title:r.checksResults.find(c=>c.ruleId==='img-alt-present').title};}); console.log('de before side file', JSON.stringify(en));
 await page.addScriptTag({content:DE});
 const de=await page.evaluate(()=>{const r=a11ycore.runa11yCoreInPage(location.href,null,{locale:'de-AT'},null); const c=r.checksResults.find(c=>c.ruleId==='img-alt-present'); return {locale:r.engine.locale,title:c.title,summary:c.occurrences[0].summary, rollupTitle:r.rulesResults[0].title};}); console.log('de after', JSON.stringify(de));
 await page.addScriptTag({content:JA});
 const ja=await page.evaluate(()=>{const r=a11ycore.runa11yCoreInPage(location.href,null,{locale:'ja'},null); const c=r.checksResults.find(c=>c.ruleId==='img-alt-present'); return {locale:r.engine.locale,title:c.title};}); console.log('ja', JSON.stringify(ja));
 // load i18n before bundle
 const p2=await b.newPage(); await p2.goto(base+'/p'); try{ await p2.addScriptTag({content:DE}); }catch(e){ console.log('i18n-before-bundle:', e.message.split('\n')[0]); }
 // CSP page
 await page.goto(base+'/csppage'); await page.waitForTimeout(500); console.log('CSP results', JSON.stringify(await page.evaluate(()=>window.__out)));
 console.log('console msgs', msgs.filter(m=>/eval|Content Security|error/i.test(m)).slice(0,6));
 // page.evaluate on csp page with serialized function (Playwright bypasses CSP?)
 const {FN}=require('./lib.cjs');
 try{ const r=await page.evaluate(([fn])=>{ const f=(0,eval)('('+fn+')'); return f(location.href,null,{},null).checksResults.length; },[FN]); console.log('eval-serialized under CSP OK', r);}catch(e){console.log('eval-serialized under CSP FAIL', e.message.split('\n')[0]);}
 try{ const r=await page.evaluate(new Function('return ('+FN+')(location.href,null,{},null).checksResults.length')); console.log('fnString page.evaluate', r);}catch(e){console.log('fnString page.evaluate fail', e.message.split('\n')[0]);}
 try{ const r=await page.evaluate(`(${FN})(location.href,null,{},null).checksResults.length`); console.log('string expr page.evaluate under CSP', r);}catch(e){console.log('string page.evaluate fail', e.message.split('\n')[0]);}
 await b.close(); server.close(); })();
