const {launch,serve,scanPage}=require('./lib.cjs');
(async()=>{ const {server,base}=await serve({'/s':{body:'<!doctype html><html lang="en"><head><title>S</title></head><body><main><a href="/light">ok link</a><host-el></host-el></main></body></html>'}});
 const b=await launch(); const page=await b.newPage(); await page.goto(base+'/s');
 await page.evaluate(()=>{ const h=document.querySelector('host-el'); const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<a href="/z"></a>'; });
 const r=await scanPage(page, base+'/s', null, {includeShadowDom:true});
 const c=r.checksResults.find(c=>c.ruleId==='link-name-present'); console.log(JSON.stringify(c.occurrences,null,1));
 const r2=await scanPage(page, base+'/s', null, {});
 console.log("default", JSON.stringify(r2.checksResults.find(c=>c.ruleId==="link-name-present").occurrences.map(o=>[o.selector,o.structuralPath])));
 await b.close(); server.close(); })();
