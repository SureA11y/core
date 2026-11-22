const http=require('http'),fs=require('fs');const {chromium}=require('/home/user/core/node_modules/playwright');const {pages}=require('./pages');
const b=fs.readFileSync('dev/cnt/surea11y.browser.js');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const p of ['table','docs']){const pg=await br.newPage();await pg.setContent(pages[p]());await pg.addScriptTag({content:String(b)});
const n=await pg.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{},{type:'rule',values:['contrast-computable','contrast-enhanced','contrast-minimum','symbol-graphic-contrast']});return [window.__fc, r.checksResults.map(c=>c.ruleId+':'+(c.occurrences||[]).length).join(' ')];});console.log(p,n);}
await br.close();})();
