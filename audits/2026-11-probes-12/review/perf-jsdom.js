// node perf-jsdom.js <tree> <reps> : CPU ms per whole scan on each page, median
const tree=process.argv[2],reps=+process.argv[3]||5;const ROOT={main:'/home/user/core',now:'/home/user/r12-review',v117:'/home/user/core-v117'}[tree];
const {JSDOM}=require('/home/user/r12-review/node_modules/jsdom');const core=require(ROOT+'/src/index.js');const fs=require('fs');
const dir='/tmp/surea11y-audit/r12/api/perf/';const pages=(process.env.PAGES||'blog,forms,news,spa,shop').split(',').map(p=>'page-'+p+'.html');
const W=console.warn;console.warn=()=>{};
const out={};let tot=0;
for(const f of pages){const html=fs.readFileSync(dir+f,'utf8');const ts=[];
 for(let i=0;i<reps+1;i++){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
  const c=process.cpuUsage();core.runDomRulesInPage(d.window.location.href,null,{},null);const u=process.cpuUsage(c);if(i)ts.push((u.user+u.system)/1000);d.window.close();}
 ts.sort((a,b)=>a-b);out[f.slice(5,-5)]=Math.round(ts[ts.length>>1]);tot+=out[f.slice(5,-5)];}
if(global.gc){global.gc();}
console.log(tree.padEnd(5),JSON.stringify(out),'total',Math.round(tot),'heapMB',(process.memoryUsage().heapUsed/1e6).toFixed(0));
