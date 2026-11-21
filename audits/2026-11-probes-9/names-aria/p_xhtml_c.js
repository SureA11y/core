const { chromium } = require('/home/user/core-r9/node_modules/playwright');
const x=`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><title>T</title></head><body><main><p>Hello world</p></main></body></html>`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.route('http://t.test/x.xhtml',r=>r.fulfill({status:200,contentType:'application/xhtml+xml',body:x}));
await p.goto('http://t.test/x.xhtml');
console.log('contentType',await p.evaluate(()=>document.contentType),'matches :lang(en)',await p.evaluate(()=>document.documentElement.matches(':lang(en)')));
await p.addScriptTag({path:'/home/user/core-r9/surea11y.browser.js'});
console.log(await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},['html-lang-attr-present']);return JSON.stringify(r.checksResults.map(c=>[c.outcome,c.occurrences.map(o=>o.data.details.reasonCode+' '+o.summary)]))}));
await b.close();})();
