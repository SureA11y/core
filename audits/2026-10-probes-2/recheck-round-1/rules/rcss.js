const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const core=require('/home/user/core/src');
for (const [rules,els] of [[1000,1000],[4000,1000],[4000,2000]]){
 let css=''; for(let i=0;i<rules;i++) css+=`.c${i} .d${i%50} > span:not(.x${i}){color:#${(i*7919%0xffffff).toString(16).padStart(6,'0')};margin:${i%7}px}\n`;
 let body=''; for(let i=0;i<els;i++) body+=`<div class="c${i%rules} d${i%50}"><span>t${i}</span> <a href="#${i}">l</a></div>`;
 const html=`<!doctype html><html lang=en><head><title>S</title><style>${css}</style></head><body><main>${body}</main></body></html>`;
 const dom=new JSDOM(html,{url:'https://example.com/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
 const t=Date.now();
 const r=core.runDomRulesInPage('https://example.com/',null,{perfStats:true,profileRules:true},null);
 const tm=r.perfStats.ruleTimings;
 console.log('cssRules',rules,'els',els,'total',Date.now()-t,'ms top',Object.entries(tm).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+':'+Math.round(v)).join(' '));
}
