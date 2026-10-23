const {launch,serve,scanPage}=require('./lib.cjs'); const P=require('./pages.cjs');
const complex=`<!doctype html><html lang="en"><head><title>C</title></head><body>
<div id="a:b"><img src="1.png"></div><div id="1start"><img src="2.png"></div><div id="dup"><img src="3.png"></div><div id="dup"><img src="4.png"></div>
<div class="x.y [z]"><button></button></div><svg><a href="#"><text>t</text></a><image href="i.png"/></svg>
<ul><li><a href="/q"></a></li><li><a href="/q"></a></li></ul>
<host-el id="h1"></host-el><host-el></host-el>
<table><tr><td><input type="checkbox"></td></tr></table>
<div id="${"'quote\""}"><input></div><div id="ünï ç"><select></select></div>
</body></html>`;
(async()=>{
 const {server,base}=await serve({'/c':{body:complex},'/v':{body:P.violations},'/nasty':{body:P.nasty}});
 const b=await launch(); const page=await b.newPage();
 for (const p of ['/c','/v','/nasty']){
 await page.goto(base+p);
 if(p==='/c') await page.evaluate(()=>{ for(const h of document.querySelectorAll('host-el')){ const sr=h.attachShadow({mode:'open'}); sr.innerHTML='<div><img src="s.png"><button></button><inner-el></inner-el></div>'; const i=sr.querySelector('inner-el').attachShadow({mode:'open'}); i.innerHTML='<a href="/z"></a>'; } });
 for (const shadow of [false,true]){
 const r=await scanPage(page, base+p, null, {includeShadowDom:shadow});
 const occs=[]; for(const c of r.checksResults) for(const o of c.occurrences) if(o.selector) occs.push({rule:c.ruleId,sel:o.selector,sp:o.structuralPath,html:o.html});
 const res=await page.evaluate((occs)=>{ const out=[]; for(const o of occs){ let byS=null,count=-1,err=null; try{ const all=document.querySelectorAll(o.sel); count=all.length; byS=all[0]||null;}catch(e){err=e.message} let byP=null; if(Array.isArray(o.sp)){ byP=document.documentElement; for(const i of o.sp){ byP=byP&&byP.children[i]; } } const htmlOk = byS? byS.outerHTML.startsWith(o.html.replace(/…$/,'').slice(0,40)) : false; if(err||count!==1||byS!==byP||!htmlOk) out.push({rule:o.rule,sel:o.sel,count,err,samePath:byS===byP, sp:o.sp, htmlOk, html:o.html.slice(0,80)}); } return out; }, occs);
 console.log(p,'shadow',shadow,'occ',occs.length,'bad',res.length); for(const x of res.slice(0,12)) console.log('  ',JSON.stringify(x));
 }}
 await b.close(); server.close();
})();
