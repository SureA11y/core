const {run4}=require('./h.js');
const page=(head,body)=>`<!doctype html><html lang=en><head><title>t</title><script>${head}</script></head><body><main><h1>h</h1>${body}</main></body></html>`;
const focusBody=`<div aria-hidden="true"><a href="#x" id=fa>link</a></div><button id=b>ok</button>`;
run4([
 {name:'H9 handler re-pollutes occurrenceOutcome mid-scan; img-alt-present runs after aria-hidden-focus',rules:['aria-hidden-focus','img-alt-present'],
  html:page(`document.addEventListener('focusin',()=>{Object.prototype.occurrenceOutcome='pass';Object.prototype.outcome='pass'},true);`,focusBody+'<img src=a.png><img src=b.png>')},
 {name:'H11 pollution, async entry',entry:'runa11yCoreInPageAsync',rules:['img-alt-present'],
  html:page(`Object.prototype.occurrenceOutcome='pass';Object.prototype.outcome='pass';`,'<img src=a.png>'),after:`()=>({oo:({}).occurrenceOutcome})`},
 {name:'H13 async entry: Object.prototype.deadline/timeoutMs read by preload (no budget)',entry:'runa11yCoreInPageAsync',rules:['css-orientation-lock'],
  html:page(`Object.prototype.deadline=0;`,'<link rel=stylesheet href="https://cdn.example.test/a.css">'),route:(r)=>r.request().url().includes('cdn.example')?r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'text/css'},body:'@media (orientation:portrait){body{transform:rotate(90deg)}}'}):r.continue()},
]);
