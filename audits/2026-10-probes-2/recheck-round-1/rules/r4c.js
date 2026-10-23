const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const bundle of [process.argv[2],'/home/user/core/surea11y.browser.js',process.argv[2]]){
  const B=fs.readFileSync(bundle,'utf8');
  for (const wrap of [0,1]){
  let h=''; for(let i=0;i<40000;i++) h+= wrap?`<div><p style="color:#000">t${i}</p></div>`:`<p style="color:#000">t${i}</p>`;
  const p=await b.newPage(); await p.setContent('<!doctype html><html lang=en><title>x</title><body>'+h); await p.addScriptTag({content:B});
  const r=await p.evaluate(()=>Promise.resolve(a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true},['contrast-minimum'])).then(r=>r.perfStats.ruleTimings['contrast-minimum']));
  console.log(bundle.slice(-12),wrap?'wrapped':'siblings',Math.round(r)); await p.close();}
 }
 await b.close();
})();
