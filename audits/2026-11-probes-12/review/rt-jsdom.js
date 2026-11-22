const tree=process.argv[2];const ROOT={main:'/home/user/core',now:'/home/user/r12-review'}[tree];const pg=process.argv[3]||'shop';
const {JSDOM}=require('/home/user/r12-review/node_modules/jsdom');const core=require(ROOT+'/src/index.js');const fs=require('fs');console.warn=()=>{};
const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');const acc={};
for(let i=0;i<2;i++){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
 const r=core.runDomRulesInPage(d.window.location.href,null,{perfStats:true,profileRules:true},null);const t=r.perfStats.ruleTimings;for(const k in t)(acc[k]=acc[k]||[]).push(t[k]);d.window.close();}
fs.writeFileSync('rt-'+tree+'-'+pg+'.json',JSON.stringify(Object.fromEntries(Object.entries(acc).map(([k,v])=>[k,Math.min(...v)]))));
