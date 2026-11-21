'use strict';
// Heap kept after one scan, against page size: is it the engine's own one-time set-up, or does it grow with the page?
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();
for(const n of [20,1500,6000,24000]){const p=await b.newPage();const cdp=await p.context().newCDPSession(p);await p.setContent(kinds.mixed(n));await p.evaluate(C.BUNDLE);
const gc=async()=>{for(let k=0;k<4;k++)await cdp.send('HeapProfiler.collectGarbage');const h=await cdp.send('Runtime.getHeapUsage');const d=await cdp.send('Memory.getDOMCounters');return [+(h.usedSize/1048576).toFixed(2),d.nodes]};
const g0=await gc();await p.evaluate(()=>{window.a11ycore.runa11yCoreInPage(null,null,{},null)});const g1=await gc();
await p.evaluate(()=>{window.a11ycore.runa11yCoreInPage(null,null,{},null)});const g2=await gc();
await p.evaluate(()=>{document.querySelector('main').remove()});const g3=await gc();
console.log(JSON.stringify({n,before:g0,afterScan1:g1,afterScan2:g2,afterRemoval:g3,keptMB:+(g3[0]-g0[0]).toFixed(2)}));await p.close();}
await b.close();})();
