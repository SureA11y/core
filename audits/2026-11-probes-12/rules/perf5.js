const fs=require('fs');const {chromium}=require('/home/user/r12-rules/node_modules/playwright');
const bundle=fs.readFileSync('/home/user/r12-rules/surea11y.browser.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pages={composite:fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-composite.html','utf8'),shop:fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-shop.html','utf8'),
 boxes60:`<!doctype html><html lang=en><body>${'<div style="height:20px;width:100px;overflow:hidden">Clipped text that runs onto more lines here</div>'.repeat(60)}</body></html>`,
 clip3000:`<!doctype html><html lang=en><body>${'<div style="height:20px;width:100px;overflow:hidden"><span>a</span> <span>b</span> <em>c</em> clipped text more words</div>'.repeat(1500)}</body></html>`};
for(const [n,h] of Object.entries(pages)){const p=await b.newPage({viewport:{width:640,height:800}});await p.setContent(h,{waitUntil:'load'}).catch(()=>{});await p.addScriptTag({content:bundle});
 const v=await p.evaluate(async()=>{const r0=performance.now();await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['page-title-present']}},null);const base=performance.now()-r0;const t=performance.now();const r=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['resize-text-content-loss']}},null);const c=r.checksResults[0];return {ms:Math.round(performance.now()-t-base),outcome:c.outcome,n:c.occurrences.length,data:JSON.stringify(c.data||{}).slice(0,200)};});
 console.log(n,JSON.stringify(v));await p.close();}
await b.close();})();
