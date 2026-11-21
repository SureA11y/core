const { chromium } = require('/home/user/core-r10/node_modules/playwright');const fs=require('fs');
const B=fs.readFileSync('/home/user/core-r10/surea11y.browser.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const [label,html,inj] of [
 ['evaluate-inject','<marquee>Sub</marquee>','eval'],
 ['addScriptTag','<marquee>Sub</marquee>','tag'],
 ['page has unrelated inline script using .start()','<marquee>Sub</marquee><script>const t=performance; window.x={start(){}}; x.start();</script>','eval'],
]){const p=await b.newPage();await p.setContent('<!doctype html><html lang="en"><head><title>T</title></head><body><main>'+html+'</main></body></html>');
 if(inj==='eval') await p.evaluate(B); else await p.addScriptTag({content:B});
 const r=await p.evaluate(async()=>{const res=await window.a11ycore.runa11yCoreInPage(null,null,{},null);const c=res.checksResults.find(c=>c.ruleId==='deprecated-elements-not-used');return c.outcome+' lean='+JSON.stringify(c.occurrences[0].lean&&c.occurrences[0].lean.toward);});
 console.log(label,'->',r);await p.close();}
await b.close();})();
