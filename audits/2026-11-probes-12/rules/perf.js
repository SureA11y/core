const fs=require('fs');const {chromium}=require('/home/user/r12-rules/node_modules/playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const T={r8:'/home/user/core-r8/surea11y.browser.js',now:'/home/user/r12-rules/surea11y.browser.js'};
const rules=process.argv[3].split(',');const pages=process.argv[2].split(',');const vw=+(process.argv[4]||1280);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const pg of pages){const html=fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-'+pg+'.html','utf8');
 for(const r of rules){const row=[pg,r];for(const t of ['r8','now']){const ms=[];
  for(let i=0;i<7;i++){const p=await b.newPage({viewport:{width:vw,height:800}});await p.setContent(html,{waitUntil:'load'}).catch(()=>{});await p.addScriptTag({content:fs.readFileSync(T[t],'utf8')});
   const v=await p.evaluate(async(r)=>{const t=performance.now();try{const res=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:[r]}},null);const c=res.checksResults.find(x=>x.ruleId===r);return [Math.round(performance.now()-t),c?c.outcome+':'+(c.occurrences||[]).length:'none'];}catch(e){return [-1,String(e).slice(0,60)]}},r);ms.push(v);await p.close();}
  ms.sort((a,b)=>a[0]-b[0]);row.push(t+'='+ms[3][0]+'ms('+ms[3][1]+')');}
  console.log(row.join(' '));}}
await b.close();})();
