'use strict';
// After one scan of a big page, the page throws its content away: do DOM nodes or heap stay alive because of the engine?
// Compares: no scan, a scan, a scan + highlight/inspect/table; nodes and heap after GC. node retained-after-scan.js [bundle]
const fs=require('fs');const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
const BUNDLE=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):C.BUNDLE;
const PAGE=kinds.mixed(6000);
(async()=>{const b=await C.launch(['--js-flags=--expose-gc']);
for(const mode of ['none','scan','scanAsync','highlight','inspect','table','run']){
 const p=await b.newPage();const cdp=await p.context().newCDPSession(p);await p.setContent(PAGE);await p.evaluate(BUNDLE);
 const gc=async()=>{for(let k=0;k<4;k++)await cdp.send('HeapProfiler.collectGarbage');const h=await cdp.send('Runtime.getHeapUsage');const d=await cdp.send('Memory.getDOMCounters');return {mb:+(h.usedSize/1048576).toFixed(2),nodes:d.nodes}};
 const g0=await gc();
 await p.evaluate(async(mode)=>{const a=window.a11ycore;console.table=()=>{};console.log=()=>{};console.info=()=>{};
  if(mode==='scan')a.runa11yCoreInPage(null,null,{},null);
  if(mode==='scanAsync')await a.runa11yCoreInPageAsync(null,null,{},null);
  if(mode==='highlight'){const r=a.runa11yCoreInPage(null,null,{},null);a.highlight(r);a.clearHighlights();}
  if(mode==='inspect'){await a.inspect('names',{});a.clearHighlights();}
  if(mode==='table'){const r=await a.run();a.table(r);}
  if(mode==='run'){await a.run();}
 },mode);
 const g1=await gc();
 await p.evaluate(()=>{document.querySelector('main').remove();});
 const g2=await gc();
 const glob=await p.evaluate(()=>Object.keys(window).filter(k=>/a11y/i.test(k)).concat(Object.getOwnPropertySymbols(window).map(String)));
 console.log(JSON.stringify({mode,before:g0,afterScan:g1,afterRemoval:g2,globals:glob}));await p.close();}
await b.close();})();
