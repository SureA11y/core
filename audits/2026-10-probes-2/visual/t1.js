const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await b.newPage(); await p.setContent('<p style="color:#777">hi</p>'); await p.addScriptTag({content:fs.readFileSync('/home/user/core/surea11y.browser.js','utf8')});
const r=await p.evaluate(()=>a11ycore.runa11yCoreInPage(location.href,null,{},['contrast-minimum']));
console.log(Object.keys(r)); console.log(JSON.stringify(r.checksResults,null,1).slice(0,2500)); await b.close();})();
