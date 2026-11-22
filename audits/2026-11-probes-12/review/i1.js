const fs=require('fs');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const {chromium}=require('/home/user/r12-review/node_modules/playwright');
const html=`<!doctype html><html lang=en><head><title>Shop page</title></head><body><main><h1>h</h1><a href=#>x</a><input type=number style="width:3.6em" aria-label=q><p style="color:#777;background:#fff">grey text</p><div style="height:1.2em;overflow:hidden;width:200px;font-size:16px">Free delivery<br>on orders over 50 euros</div><div style="zoom:.5"><input type=checkbox aria-label=a><input type=checkbox aria-label=b></div></main></body></html>`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const tree of ['/home/user/r12-review']){const p=await b.newPage({viewport:{width:400,height:800}});await p.setContent(html);await p.addScriptTag({content:fs.readFileSync(tree+'/surea11y.browser.js','utf8')});
 for(const loc of ['fr','de','es']){await p.addScriptTag({content:fs.readFileSync(tree+'/surea11y.i18n.'+loc+'.js','utf8')});
 const r=await p.evaluate(async(loc)=>{const en=await a11ycore.runa11yCoreInPage(null,null,{},null);const x=await a11ycore.runa11yCoreInPage(null,null,{locale:loc},null);
  const out=[];const strip=o=>{const c=JSON.parse(JSON.stringify(o));for(const k of ['summary','hint','message','title','description','help','why','caution','needed','question','text','label'])delete c[k];return c};
  const walk=(o,f)=>{if(o&&typeof o==='object'){for(const k in o){if(['summary','hint','message','why','needed','question','caution','description','title','help','reasonText','text'].includes(k))continue;walk(o[k],f)}}else f(o)};
  for(let i=0;i<x.checksResults.length;i++){const A=x.checksResults[i],E=en.checksResults[i];
   for(let j=0;j<(A.occurrences||[]).length;j++){const a=A.occurrences[j],e=E.occurrences[j];if(!e)continue;
    if(/\d,\d/.test(a.summary||''))out.push(A.ruleId+': '+String(a.summary).slice(0,150));
    if(/\d\.\d/.test(a.summary||''))out.push('DOT '+A.ruleId+': '+String(a.summary).match(/.{0,40}\d\.\d.{0,20}/)[0]);
    const sa=[],se=[];walk(strip(a),v=>sa.push(v));walk(strip(e),v=>se.push(v));if(JSON.stringify(sa)!==JSON.stringify(se))out.push('MACHINE DIFF '+A.ruleId+' '+JSON.stringify(sa).slice(0,200)+' vs '+JSON.stringify(se).slice(0,200));}}
  return out;},loc);console.log(loc,r.join('\n   '));}
 await p.close();}
await b.close();})();
