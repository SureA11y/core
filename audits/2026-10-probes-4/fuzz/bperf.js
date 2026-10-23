const {chromium}=require('/home/user/core/node_modules/playwright');const fs=require('fs');
const bundle=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage();
const n=+process.argv[2];await p.setContent('<!doctype html><html lang=en><head><title>t</title></head><body><main>'+'<div>'.repeat(n)+'x'+'</div>'.repeat(n)+'</main></body></html>');await p.addScriptTag({content:bundle});
const out=await p.evaluate(()=>{const t=performance.now();const r=window.a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true});return [performance.now()-t, r.perfStats.ruleTimings['p-as-heading']];});
console.log(n,'chromium total',out[0].toFixed(0),'p-as-heading',out[1].toFixed(0));await b.close();})();
