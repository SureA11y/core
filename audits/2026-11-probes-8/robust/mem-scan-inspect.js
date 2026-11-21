'use strict';
// Alternate a full scan and a11ycore.inspect() N times on one page; heap after GC every 50.
// node mem-scan-inspect.js N [variant: both|scanthen-headings|inspect-only|scan-only]
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
const [N,variant]=[+process.argv[2],process.argv[3]||'both'];
(async()=>{const b=await C.launch();const page=await b.newPage();const cdp=await page.context().newCDPSession(page);
await page.setContent(kinds.mixed(600));await C.inject(page);await page.evaluate(()=>{console.table=()=>{};console.log=()=>{}});
const pts=[];
for(let i=0;i<=N;i++){
 if(i%(+process.env.EVERY||50)===0){for(let k=0;k<3;k++)await cdp.send('HeapProfiler.collectGarbage');const h=await cdp.send('Runtime.getHeapUsage');pts.push([i,+(h.usedSize/1048576).toFixed(2)]);}
 if(i===N)break;
 await page.evaluate(async(v)=>{const a=window.a11ycore;
   if(v!=='inspect-only') a.runa11yCoreInPage(null,null,{},null);
   if(v==='both') await a.inspect('names',{draw:false});
   if(v==='scanthen-headings') await a.inspect('headings',{draw:false});
   if(v==='scan-async') await a.runa11yCoreInPageAsync(null,null,{},{includeRuleIds:['image-alt']});
   if(v==='scan-rule') a.runa11yCoreInPage(null,null,{},{includeRuleIds:['img-alt-present']});
   if(v==='scan-custom') a.runa11yCoreInPage(null,null,{customRules:[{id:'x-custom',meta:{title:'X',defaultSeverity:'minor'},runInPage:function(){return {outcome:'pass',occurrences:[]}}}]},null);
   return 1},variant);}
console.log(JSON.stringify({N,variant,points:pts,perIterKB:+(((pts[pts.length-1][1]-pts[1][1])*1024)/(N-50)).toFixed(2)}));await b.close();})();
