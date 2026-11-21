'use strict';
// Scan with the page's Promise removed or replaced (after the bundle loads, as a page's later script would).
const fs=require('fs');const { serve, launch, addBundle, diff } = require('./lib');
const html=fs.readFileSync(__dirname+'/combined.html','utf8');
const poisons={none:'',removed:'window.Promise=undefined',thenNoop:'Promise.prototype.then=function(){return this}',
 resolveNever:'Promise.resolve=()=>new Promise(()=>{})',
 minimalPolyfill:`window.Promise=function P(ex){const cbs=[];let v,done=false;this.then=(f)=>{if(done)setTimeout(()=>f(v));else cbs.push(f);return this};ex(x=>{v=x;done=true;cbs.forEach(f=>setTimeout(()=>f(x)))},()=>{})};window.Promise.resolve=x=>new window.Promise(r=>r(x));`};
(async()=>{const s=await serve({'/c':{body:html}});const {browser,context}=await launch();let base;
for(const [k,code] of Object.entries(poisons)){const page=await context.newPage();await page.goto(s.base+'/c');await addBundle(page,s.base);
 await page.evaluate((c)=>{window.__done=null;(0,eval)(c);
   const run=()=>{try{const r=window.a11ycore.runa11yCoreInPage(null,null,{},null);
     const fin=(x)=>{const out={};for(const c of x.checksResults)out[c.ruleId]=c.outcome+' x'+(c.occurrences||[]).length;window.__done=JSON.stringify({ok:true,out,thenable:typeof r.then})};
     if(r&&typeof r.then==='function'){r.then(fin,(e)=>{window.__done=JSON.stringify({ok:false,msg:String(e)})});}else fin(r);}catch(e){window.__done=JSON.stringify({ok:false,msg:String(e&&e.stack||e).slice(0,300),code:e&&e.code})}};
   setTimeout(run,0);},code);
 let res=null;for(let i=0;i<120&&!res;i++){await new Promise(r=>setTimeout(r,500));res=await page.evaluate('window.__done').catch(e=>'EVALERR '+e.message.slice(0,80));}
 if(!res){console.log(k,'NO RESULT after 60s (hang)');}
 else if(String(res).startsWith('EVALERR')){console.log(k,res)}
 else{const r=JSON.parse(res);if(k==='none'){base=r.out;console.log(k,'ok thenable=',r.thenable)}else if(!r.ok)console.log(k,'THROW',r.code,r.msg);else{const d=diff(base,r.out);console.log(k,'thenable=',r.thenable,d.length?'DIFF '+d.length+' '+d.slice(0,6).join(' | '):'same')}}
 await page.close();}
await browser.close();s.close();})();
