const fs=require('fs');const {chromium}=require('/home/user/r12-rules/node_modules/playwright');
const T={r8:'/home/user/core-r8/surea11y.browser.js',now:'/home/user/r12-rules/surea11y.browser.js'};
const [pg,r,n]=[process.argv[2],process.argv[3],+(process.argv[4]||9)];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const html=fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-'+pg+'.html','utf8');
const out={r8:[],now:[]};
for(let i=0;i<n;i++)for(const t of (i%2?['r8','now']:['now','r8'])){const p=await b.newPage({viewport:{width:1280,height:800}});await p.setContent(html,{waitUntil:'load'}).catch(()=>{});await p.addScriptTag({content:fs.readFileSync(T[t],'utf8')});
 const v=await p.evaluate(async(r)=>{await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['page-title-present']}},null);
  const t0=performance.now();await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['page-title-present']}},null);const base=performance.now()-t0;
  const t=performance.now();const res=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:[r]}},null);const tot=performance.now()-t;
  const c=res.checksResults.find(x=>x.ruleId===r);return {tot:Math.round(tot),base:Math.round(base),keys:Object.keys(c).join(','),timing:c.durationMs??c.timeMs??(c.timing&&JSON.stringify(c.timing))};},r);
 out[t].push(v);await p.close();}
for(const t of ['r8','now']){const a=out[t].map(x=>x.tot-x.base).sort((x,y)=>x-y);console.log(t,'rule-minus-baseline median',a[a.length>>1],'all',a.join(' '),'timing',out[t][0].timing);}
console.log(out.now[0].keys);await b.close();})();
