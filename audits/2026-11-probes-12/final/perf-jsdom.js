// jsdom CPU per whole scan: node perf-jsdom.js pages reps ; builds interleaved, each in its own child to avoid shared JIT state
const {execFileSync}=require('child_process');const [pgs,reps=3]=process.argv.slice(2);
const B={v117:'/home/user/core-v117',main:'/home/user/core',final:'/home/user/r12-final'};
if(process.argv[4]==='child'){const [, , pg, , , root]=process.argv;const {JSDOM}=require('/home/user/r12-final/node_modules/jsdom');const core=require(root+'/src/index.js');const html=require('fs').readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');
 const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
 // warm-up on a small page in the same process
 {const w=new JSDOM('<!doctype html><html lang=en><title>t</title><main><h1>x</h1><p>y</p></main>',{url:'https://example.test/',pretendToBeVisual:true});global.window=w.window;global.document=w.window.document;core.runDomRulesInPage('https://example.test/',null,{},null);global.window=d.window;global.document=d.window.document;}
 const c=process.cpuUsage();core.runDomRulesInPage('https://example.test/',null,{},null);const u=process.cpuUsage(c);console.log(Math.round((u.user+u.system)/1000));process.exit(0);}
const res={};for(const pg of pgs.split(',')){res[pg]={};for(let i=0;i<+reps;i++)for(const b of Object.keys(B)){const out=execFileSync('node',[__filename,pg,0,'child',B[b]],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();(res[pg][b]=res[pg][b]||[]).push(+out);}
 const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];console.log(pg,Object.entries(res[pg]).map(([b,v])=>b+'='+med(v)+' ['+v.join(',')+']').join(' '));}
