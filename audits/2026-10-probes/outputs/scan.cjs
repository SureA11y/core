const {launch,serve,scanPage}=require('./lib.cjs'); const P=require('./pages.cjs'); const fs=require('fs');
function huge(){ let b='<!doctype html><html lang="en"><head><title>Huge</title></head><body><main>'; for(let i=0;i<1000;i++){ b+=`<section class="c${i%7}"><h2>S${i}</h2><p style="color:#999">p ${i}</p><img src="i${i}.png"><a href="/l${i}">link</a></section>`;} return b+'</main></body></html>'; }
(async()=>{
 const {server,base}=await serve({'/clean':{body:P.clean},'/v':{body:P.violations},'/empty':{body:P.empty},'/nasty':{body:P.nasty},'/huge':{body:huge()}});
 const b=await launch(); const page=await b.newPage();
 const out={};
 for (const [k,p] of [['clean','/clean'],['violations','/v'],['empty','/empty'],['nasty','/nasty'],['huge','/huge']]){
   await page.goto(base+p);
   if(k==='nasty'){ await page.evaluate(()=>{ const i=document.createElement('img'); i.setAttribute('src','n.png'); i.setAttribute('data-ctl','\u0000\u001b\u0007\uD800 x ]]> </script>'); i.setAttribute('class','a\u0000b'); document.body.appendChild(i); const d=document.createElement('button'); d.setAttribute('aria-label','\u0000'); document.body.appendChild(d);}); }
   const n = await page.evaluate(()=>document.querySelectorAll('*').length);
   const t=Date.now(); const r=await scanPage(page, base+p, null, {}); const ms=Date.now()-t;
   out[k]=r; const s=JSON.stringify(r);
   const fails=r.checksResults.filter(c=>c.outcome==='fail').length, occ=r.checksResults.reduce((a,c)=>a+c.occurrences.length,0);
   const eo=r.checksResults.reduce((a,c)=>a+JSON.stringify(c.engineOptions).length,0), meta=r.checksResults.reduce((a,c)=>a+JSON.stringify(c.meta).length,0)+r.rulesResults.reduce((a,c)=>a+JSON.stringify(c.meta).length+JSON.stringify(c.engineOptions).length,0);
   const vis=r.checksResults.reduce((a,c)=>a+c.occurrences.reduce((x,o)=>x+JSON.stringify((o.data||{}).visibilityFilter||'').length,0),0);
   console.log(k,'elements',n,'ms',ms,'bytes',s.length,'checks',r.checksResults.length,'fails',fails,'occ',occ,'engineOptsBytes',eo,'metaBytes',meta,'visFilterBytes',vis, 'distinct engineOptions', new Set(r.checksResults.map(c=>JSON.stringify(c.engineOptions))).size);
 }
 fs.writeFileSync('results.json', JSON.stringify(out));
 await b.close(); server.close();
})().catch(e=>{console.error(e);process.exit(1)});
