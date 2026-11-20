const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();
const ids=JSON.parse(process.argv[2]||'null');
const p0=await b.newPage();await p0.setContent('<p>x');await C.inject(p0);const all=ids||await p0.evaluate(()=>window.a11ycore.runa11yCoreInPage(null,null,{},null).checksResults.map(c=>c.ruleId));await p0.close();
for(const id of all){const page=await b.newPage();const cdp=await page.context().newCDPSession(page);
await page.setContent(kinds.mixed(2000));await C.inject(page);
const g=async()=>{for(let k=0;k<2;k++)await cdp.send('HeapProfiler.collectGarbage');return (await cdp.send('Memory.getDOMCounters')).nodes};
const a=await g();await page.evaluate((id)=>{window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:[id]});delete window.__a11ycoreSharedCache;return 1},id);const c=await g();
if(c!==a)console.log(id,a,c,c-a);await page.close();}
await b.close();})();
