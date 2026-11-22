process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const fs=require('fs');const html=fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-shop.html','utf8');
const ROOTS={r8:'/home/user/core-r8',main:'/home/user/core',br:'/home/user/r12-contrast'};
const { chromium } = require('/home/user/r12-contrast/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const res={};
for(let rep=0;rep<7;rep++)for(const root in ROOTS){const p=await b.newPage({viewport:{width:1280,height:800}});await p.setContent(html,{waitUntil:'load'});await p.addScriptTag({path:ROOTS[root]+'/surea11y.browser.js'});
const s=await p.context().newCDPSession(p);await s.send('Performance.enable',{timeDomain:'threadTicks'});
const m=async()=>Object.fromEntries((await s.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
const a=await m();await p.evaluate(()=>window.a11ycore.runa11yCoreInPage(null,null,{},['contrast-computable']));const z=await m();
(res[root]=res[root]||[]).push(Math.round((z.TaskDuration-a.TaskDuration)*1000));await p.close();}
for(const r in res){const v=[...res[r]].sort((x,y)=>x-y);console.log(r.padEnd(5),'thread-ticks TaskDuration ms sorted',v.join(' '),' median',v[3]);}
await b.close();})();
