const {page,close}=require('../../visual/h.js');
const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const cases=[
 `<p style="color:#757575">a text</p>`,
 `<p style="color:rgba(0,0,0,.537)">a text</p>`,
 `<div style="background:rgba(10,20,30,.13)"><p style="color:rgba(80,90,100,.77)">a text</p></div>`,
 `<div style="opacity:.71"><p style="color:#333;background:#fafafa">a text</p></div>`,
 `<p style="color:hsl(210 13% 43%)">a text</p>`,
 `<p style="color:oklch(0.55 0.1 250)">a text</p>`,
];
(async()=>{
 const rules=['contrast-minimum','contrast-enhanced'];
 for (const h of cases){
  const full=`<!doctype html><html lang="en"><head><title>P</title><style>html,body{background:#fff;color:#000}</style></head><body>${h}</body></html>`;
  const p=await page(full);
  const rc=await p.evaluate((rules)=>a11ycore.runa11yCoreInPage(location.href,null,{},rules),rules);
  await p.close();
  const dom=new JSDOM(full,{url:'https://example.com/',pretendToBeVisual:true});
  global.window=dom.window; global.document=dom.window.document;
  delete require.cache[require.resolve('/home/user/core/src')];
  const core=require('/home/user/core/src');
  const rj=await core.runDomRulesInPage('https://example.com/',null,{},rules);
  for (const r of rules){
   const c=rc.checksResults.find(x=>x.ruleId===r), j=rj.checksResults.find(x=>x.ruleId===r);
   const mv=(x)=>x.margin?x.margin.value:(x.occurrences[0]&&x.occurrences[0].data&&x.occurrences[0].data.details&&x.occurrences[0].data.details.metrics&&x.occurrences[0].data.details.metrics.ratio);
   console.log(h.slice(0,60).padEnd(62),r.padEnd(18),'C',c.outcome,mv(c),'| J',j.outcome,mv(j), mv(c)===mv(j)?'SAME':'DIFF');
  }
 }
 await close();
})();
