const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs');const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent('<!doctype html><html lang=en><title>x</title><body style="background:#fff"><main><h1>x</h1><p style="color:#aaa">hi</p></main>');
await p.addScriptTag({content:BUNDLE});
console.log(JSON.stringify(await p.evaluate(()=>window.a11ycore.runa11yCoreInPage(location.href,null,{},null).checksResults.find(c=>c.ruleId==='contrast-minimum').occurrences),null,1).slice(0,3000));await b.close();})();
