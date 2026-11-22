const tree=process.argv[2];const ROOT={main:'/home/user/core',now:'/home/user/r12-review'}[tree];const pg=process.argv[3];const rules=process.argv[4].split(',');
const {JSDOM}=require('/home/user/r12-review/node_modules/jsdom');const core=require(ROOT+'/src/index.js');const fs=require('fs');console.warn=()=>{};
const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');const acc={};
for(let i=0;i<5;i++){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
 const c=process.cpuUsage();core.runDomRulesInPage(d.window.location.href,null,{rules:{include:rules}},null);const u=process.cpuUsage(c);(acc.cpu=acc.cpu||[]).push(Math.round((u.user+u.system)/1000));d.window.close();}
console.log(tree,pg,rules.join(','),'cpu ms',acc.cpu.sort((a,b)=>a-b).join(' '));
