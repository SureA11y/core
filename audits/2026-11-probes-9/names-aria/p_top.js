const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();

await p.setContent(`<!doctype html><html lang=en><head><title>t</title></head><body><header><a href="/">Home</a></header><main><p style="height:3000px">Long</p><a id=a href="#top">Jump to top</a></main></body></html>`);
await p.evaluate(()=>window.scrollTo(0,2000));
await p.click('#a');await p.addScriptTag({path:'/home/user/core-r9/surea11y.browser.js'}); console.log('scrollY after click', await p.evaluate(()=>scrollY));
const r=await p.evaluate(async()=>{const x=await window.a11ycore.runa11yCoreInPage(null,null,{},['skip-link']);return JSON.stringify(x.checksResults[0].occurrences.map(o=>({s:o.summary,lean:o.lean,d:o.data.details})))});
console.log(r);await b.close();})();
