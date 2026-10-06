const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const core=require('/home/user/core/src');
const rules=2000,els=1000;
let css=''; for(let i=0;i<rules;i++) css+=`.c${i} .d${i%50} > span:not(.x${i}){color:#${(i*7919%0xffffff).toString(16).padStart(6,'0')};margin:${i%7}px}\n`;
let body=''; for(let i=0;i<els;i++) body+=`<div class="c${i%rules} d${i%50}"><span>t${i}</span> <a href="#${i}">l</a></div>`;
const html=`<!doctype html><html lang=en><head><title>S</title><style>${css}</style></head><body><main>${body}</main></body></html>`;
for (const ro of [['aria-valid-attr'],['contrast-computable'],['contrast-computable','aria-valid-attr'],['aria-hidden-focus']]){
 const dom=new JSDOM(html,{url:'https://example.com/',pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;
 const t=Date.now();
 const r=core.runDomRulesInPage('https://example.com/',null,{perfStats:true,profileRules:true},ro);
 console.log(ro.join('+'),'total',Date.now()-t,JSON.stringify(Object.fromEntries(Object.entries(r.perfStats.ruleTimings).map(([k,v])=>[k,Math.round(v)]))));
}
