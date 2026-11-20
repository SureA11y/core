const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();const page=await b.newPage();const cdp=await page.context().newCDPSession(page);
const m=async(l)=>{for(let k=0;k<3;k++)await cdp.send('HeapProfiler.collectGarbage');const d=await cdp.send('Memory.getDOMCounters');const h=await cdp.send('Runtime.getHeapUsage');console.log(l,JSON.stringify(d),(h.usedSize/1048576).toFixed(2));};
await page.setContent(kinds[process.argv[2]||'mixed'](+(process.argv[3]||10000)));await C.inject(page);
await m('before');
const ro=process.argv[4]?{includeRuleIds:[process.argv[4]]}:null;
await page.evaluate((ro)=>{window.a11ycore.runa11yCoreInPage(null,null,{},ro);return 1},ro);await m('after scan');
await page.evaluate(()=>{delete window.__a11ycoreSharedCache});await m('after delete cache');
await b.close();})();
