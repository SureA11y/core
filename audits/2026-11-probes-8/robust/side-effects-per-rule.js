'use strict';
// Per rule: page-visible mutations (MutationObserver records) and scroll events caused by running that rule alone.
const fs=require('fs');const C=require('./chrome-lib.js');
const src=fs.readFileSync('side-effects.js','utf8');const PAGE=eval('`'+src.split('const PAGE = `')[1].split('`;\n(async')[0]+'`');
(async()=>{const b=await C.launch();const p=await b.newPage({viewport:{width:1280,height:720}});await p.setContent(PAGE);await p.waitForTimeout(600);
await p.evaluate(C.BUNDLE);
const ids=await p.evaluate(()=>window.a11ycore.runa11yCoreInPage(null,null,{},null).checksResults.map(c=>c.ruleId));
await p.waitForTimeout(500);
for(const id of ids){
 await p.evaluate(()=>{window.__ev={};window.__recs=[];if(!window.__mo2){window.__mo2=new MutationObserver(ms=>{for(const m of ms)window.__recs.push(m.type+' '+(m.attributeName||'')+' on '+(m.target.nodeName)+(m.target.className?'.'+m.target.className:'')+' +'+[...m.addedNodes].map(n=>n.nodeName).join(',')+' -'+[...m.removedNodes].map(n=>n.nodeName).join(',')+' old='+String(m.oldValue).slice(0,60))});window.__mo2.observe(document,{subtree:true,childList:true,attributes:true,attributeOldValue:true})}});
 await p.evaluate((id)=>window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:[id]}),id);
 await p.waitForTimeout(150);
 const r=await p.evaluate(()=>({ev:window.__ev,recs:window.__recs}));
 const ev=Object.keys(r.ev).filter(k=>!/^mut:/.test(k));
 if(r.recs.length||ev.length)console.log(id,JSON.stringify({events:ev.map(k=>k+'='+r.ev[k]),recs:[...new Set(r.recs)].slice(0,6),n:r.recs.length}));
}
await b.close();})();
