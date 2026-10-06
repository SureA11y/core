const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const core=require('/home/user/core/src');
for (const n of [5000,10000]){
 const html=`<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${'<span>a</span>'.repeat(n/2)}${'<a href="/">l</a>'.repeat(n/2)}</main></body></html>`;
 const dom=new JSDOM(html,{url:'https://example.com/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
 const t=Date.now();
 const r=core.runDomRulesInPage('https://example.com/',null,{perfStats:true,profileRules:true},null);
 const tm=r.perfStats.ruleTimings;
 console.log(n,'total',Date.now()-t,'ms top',Object.entries(tm).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+Math.round(v)).join(' '),'| litb',Math.round(tm['link-in-text-block']),'avattr',Math.round(tm['aria-valid-attr']));
}
