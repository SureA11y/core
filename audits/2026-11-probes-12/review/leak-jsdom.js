const tree=process.argv[2];const ROOT={main:'/home/user/core',now:'/home/user/r12-review'}[tree];
const {JSDOM}=require('/home/user/r12-review/node_modules/jsdom');const core=require(ROOT+'/src/index.js');const fs=require('fs');
console.warn=()=>{};const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-news.html','utf8');
const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
const mb=()=>{global.gc();global.gc();return (process.memoryUsage().heapUsed/1e6).toFixed(1)};
core.runDomRulesInPage(d.window.location.href,null,{},null);const a=mb();
for(let i=0;i<12;i++)core.runDomRulesInPage(d.window.location.href,null,{},null);console.log(tree,'heap MB after 1:',a,'after 13:',mb(),'proto keys',Object.getOwnPropertyNames(Object.prototype).length);
