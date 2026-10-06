const fs=require('fs');const {chromium}=require('/home/user/core/node_modules/playwright');
const bundle=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
for (const [lab,html] of [['siblings','<img src=a>'.repeat(10000)],['wrapped','<div><img src=a></div>'.repeat(10000)],['siblings-noSelector','<img src=a>'.repeat(10000)]]){
 await pg.setContent('<html lang=en><title>t</title><body><main>'+html+'</main>');await pg.addScriptTag({content:bundle});
 const t=await pg.evaluate((lab)=>{const eo=lab.endsWith('noSelector')?{output:{includeSelector:false}}:{};a11ycore.runa11yCoreInPage(location.href,null,eo,['img-alt-present']);const best=[];for(let i=0;i<3;i++){const t0=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,eo,['img-alt-present']);best.push(performance.now()-t0);}return Math.min(...best).toFixed(0)+'ms';},lab);
 console.log(lab,t);}
await br.close();})();
