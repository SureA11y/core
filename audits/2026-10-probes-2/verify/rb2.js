const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs'); const OURS=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
let p=await b.newPage();
await p.route('http://t.test/s.svg',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg"><title>S</title><rect width="10" height="10"/></svg>'}));
await p.goto('http://t.test/s.svg'); await p.evaluate(OURS);
console.log('svg doc', await p.evaluate(()=>{const o=window.a11ycore.runa11yCoreInPage(location.href,null,{},['page-title-present']);return document.contentType+' '+o.checksResults.map(x=>x.ruleId+'='+x.outcome+' '+(x.occurrences||[]).map(o=>o.selector).join()).join()}));
await p.close();
for (const n of [1000,2000,4000]){
  p=await b.newPage(); await p.setContent(`<!doctype html><html lang=en><title>t</title><body><main><h1>x</h1><div>Some text here ${'<img src="a.png" alt="photo">'.repeat(n)}</div></main>`);
  await p.addScriptTag({content:OURS});
  console.log('redundant-alt', n, await p.evaluate(()=>{const t=performance.now();a11ycore.runa11yCoreInPage(location.href,null,{},['image-redundant-alt']);return Math.round(performance.now()-t)+'ms'}));
  await p.close();
}
await b.close();
})();
