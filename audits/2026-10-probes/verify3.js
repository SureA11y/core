const {chromium}=require('/home/user/core/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
const cases={oklch:'<div style="background:oklch(0.2 0 0);padding:10px"><p style="color:#ddd">Hello world text</p></div>',
overlay:'<div style="position:relative;height:100px"><div style="position:absolute;inset:0;background:#000"></div><p style="position:absolute;top:0;color:#ddd">Hello world text</p></div>'};
for(const [k,h] of Object.entries(cases)){await p.setContent('<!doctype html><html lang=en><head><title>t</title><style>html{background:#fff}</style></head><body><main>'+h+'</main></body></html>');
await p.addScriptTag({path:'/home/user/core/surea11y.browser.js'});
const r=await p.evaluate(()=>{const res=window.a11ycore.runa11yCoreInPage(null,null,{},['contrast-minimum']);const c=res.checksResults.find(x=>x.ruleId==='contrast-minimum');return [c.outcome,c.confidence,c.occurrences.map(o=>o.summary).join('|')];});
console.log(k,JSON.stringify(r).slice(0,250));}
await b.close();})();
