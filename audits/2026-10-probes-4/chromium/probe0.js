const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs');
const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage();
 await p.setContent('<!doctype html><html lang=en><title>x</title><body><main><h1>x</h1><p>hi</p></main>');
 await p.addScriptTag({content:BUNDLE});
 const r=await p.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(location.href,null,{},null);return {keys:Object.keys(window.a11ycore),rk:Object.keys(r),ids:r.checksResults.map(c=>c.ruleId+':'+c.outcome), sample:r.checksResults.find(c=>c.outcome==='pass')}});
 console.log(JSON.stringify(r,null,1).slice(0,9000));
 await b.close();
})();
