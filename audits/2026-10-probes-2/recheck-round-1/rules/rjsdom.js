const {JSDOM}=require('/home/user/core/node_modules/jsdom');
function run(html,rules){const dom=new JSDOM(html,{url:'https://example.com/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;delete require.cache[require.resolve('/home/user/core/src')];const core=require('/home/user/core/src');return core.runDomRulesInPage('https://example.com/',null,{perfStats:true,profileRules:true},rules);}
(async()=>{
 const r=await run(`<!doctype html><html lang=en><title>t</title><body><button style="width:10px;height:10px">a</button><button style="width:10px;height:10px">b</button><div style="height:10px;overflow:hidden"><p>long text</p></div></body></html>`,['target-size-minimum','text-spacing-content-loss','css-orientation-lock']);
 for(const c of r.checksResults) console.log(c.ruleId,c.outcome,JSON.stringify(c.data||'').slice(0,80));
 for (const n of [1000,4000]){ let h=''; for(let i=0;i<n;i++) h+=`<img alt="A photo of item ${i} on shelf" src="x${i}.png">`;
  const r=await run('<!doctype html><html lang=en><title>t</title><body>'+h,['img-alt-quality']); console.log('alt-quality',n,Math.round(r.perfStats.ruleTimings['img-alt-quality']),'ms',r.checksResults[0].occurrences.length);}
})();
