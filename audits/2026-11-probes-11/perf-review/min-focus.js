const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');
const B=require('/home/user/core-r11/src/core.js'),A=require('/home/user/r11-perf-review/src/core.js');
const run=(core,html)=>{const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;const r=core.runDomRulesInPage(d.window.location.href,null,{rules:{include:['css-focus-indicator-suppressed']}},null);d.window.close();return JSON.stringify(r.checksResults.map(c=>[c.outcome,(c.occurrences||[]).map(o=>o.selector)]));};
let lines=require('fs').readFileSync('t-focus-thresh-j.js','utf8').match(/const css=`([\s\S]*?)`;/)[1].split('\n').filter(l=>l.trim());
let body=`<div class="card sc w m l s"><a href="#0" title="(" class="z">L0</a><button type="button">B0</button></div><div class="card sc w z m l s"><a href="#1" title="x)" class="z">L1</a><button type="button">B1</button></div>`;
const page=(ls,b)=>`<!doctype html><html lang="en"><head><title>t</title><style>${ls.join('\n')}</style></head><body><main>${b}</main></body></html>`;
const differs=(ls,b)=>run(B,page(ls,b))!==run(A,page(ls,b));
console.log('initial',differs(lines,body));
let ch=true;while(ch){ch=false;for(let i=0;i<lines.length;i++){const l2=lines.filter((_,j)=>j!==i);if(differs(l2,body)){lines=l2;ch=true;break;}}}
console.log(lines);const html=page(lines,body);console.log(html);console.log('before',run(B,html));console.log('after ',run(A,html));
