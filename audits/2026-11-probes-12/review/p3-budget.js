const {run4}=require('./h.js');
const page=(head,body)=>`<!doctype html><html lang=en><head><title>t</title><script>${head}</script></head><body><main><h1>h</h1>${body}</main></body></html>`;
const css='@media (orientation:portrait){body{transform:rotate(90deg)}}';
const slow=(ms)=>async(r)=>{if(!r.request().url().includes('cdn.example'))return r.continue();await new Promise(z=>setTimeout(z,ms));try{await r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'text/css'},body:css})}catch{}};
const L='<link rel=stylesheet href="https://cdn.example.test/a.css">';
const after=`()=>window.__w`;
const cap=`window.__w=[];const W=console.warn;console.warn=(...a)=>{window.__w.push(String(a[0]).slice(0,260));};`;
run4([
 {name:'B0 control: deadline pollution absent, no budget',entry:'runa11yCoreInPageAsync',rules:['css-orientation-lock'],html:page(cap,L),route:slow(0),after},
 {name:'B1 deadline pollution, no budget',entry:'runa11yCoreInPageAsync',rules:['css-orientation-lock'],html:page(cap+'Object.prototype.deadline=0;',L),route:slow(0),after},
 {name:'B2 budget 300, sheet 1500ms',entry:'runa11yCoreInPageAsync',opts:{timeBudgetMs:300},rules:['css-orientation-lock','img-alt-present'],html:page(cap,L+'<img src=a.png>'),route:slow(1500),after},
 {name:'B3 budget 0 (no budget?), sheet 1500ms',entry:'runa11yCoreInPageAsync',opts:{timeBudgetMs:0},rules:['css-orientation-lock','img-alt-present'],html:page(cap,L+'<img src=a.png>'),route:slow(1500),after},
 {name:'B4 budget 3000, sheet 200ms',entry:'runa11yCoreInPageAsync',opts:{timeBudgetMs:3000},rules:['css-orientation-lock','img-alt-present'],html:page(cap,L+'<img src=a.png>'),route:slow(200),after},
 {name:'B5 budget 300, sheet 1500, strictOptions+profile',entry:'runa11yCoreInPageAsync',opts:{timeBudgetMs:300,profile:['wcag22aa','en301549']},rules:['img-alt-present'],html:page(cap,L+'<img src=a.png>'),route:slow(1500),after},
],{modes:['chrome']});
