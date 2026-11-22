const {run4}=require('./h.js');
const page=(head,body)=>`<!doctype html><html lang=en><head><title>t</title><script>${head}</script></head><body><main><h1>h</h1>${body}</main></body></html>`;
// focusable inside aria-hidden: aria-hidden-focus calls focus()
const focusBody=`<div aria-hidden="true"><a href="#x" id=fa>link</a></div><button id=b>ok</button>`;
const handler=`window.seen=[];document.addEventListener('focusin',e=>{window.seen.push({cfg:typeof ({}).cfg, inCfg:'cfg' in {}, owf:typeof window.cfg}); ({}).cfg.x;},true);`;
run4([
 {name:'H1 focus handler reads a page value on Object.prototype during scan',rules:['aria-hidden-focus'],
  html:page(`Object.prototype.cfg={x:1};`+handler,focusBody),after:`()=>({seen:window.seen,cfg:({}).cfg})`},
 {name:'H2 order of enumerable values restored',rules:['html-lang-attr-present'],
  html:page(`Object.prototype.zq1=1;Object.prototype.zq2=2;Object.prototype.zq3=3;`,''),after:`()=>{const k=[];for(const x in {})k.push(x);return {forin:k, own:Object.getOwnPropertyNames(Object.prototype).slice(-4)}}`},
 {name:'H3 non-extensible Object.prototype with a value',rules:['html-lang-attr-present'],
  html:page(`Object.prototype.flag='on';Object.preventExtensions(Object.prototype);`,''),after:`()=>({flag:({}).flag,has:Object.prototype.hasOwnProperty('flag')})`},
 {name:'H4 sealed Object.prototype with a value',rules:['html-lang-attr-present'],
  html:page(`Object.prototype.flag='on';Object.seal(Object.prototype);`,''),after:`()=>({flag:({}).flag,d:Object.getOwnPropertyDescriptor(Object.prototype,'flag')})`},
 {name:'H5 frozen Object.prototype with a value',rules:['html-lang-attr-present'],
  html:page(`Object.prototype.flag='on';Object.freeze(Object.prototype);`,''),after:`()=>({flag:({}).flag})`},
 {name:'H6 defineProperty value (defaults: non-config, non-writable)',rules:['html-lang-attr-present'],
  html:page(`Object.defineProperty(Object.prototype,'flag',{value:'on'});`,''),after:`()=>({flag:({}).flag})`},
 {name:'H7 frozen Object.prototype, nothing added (SES-like)',rules:['html-lang-attr-present','image-alt-present'],
  html:page(`Object.freeze(Object.prototype);`,'<img src=x.png>'),after:`()=>Object.isFrozen(Object.prototype)`},
 {name:'H8 handler writes Object.prototype during scan',rules:['aria-hidden-focus'],
  html:page(`Object.prototype.cfg=1;document.addEventListener('focusin',()=>{Object.prototype.cfg=2;Object.prototype.fresh='new'},true);`,focusBody),after:`()=>({cfg:({}).cfg,fresh:({}).fresh})`},
 {name:'H9 handler sets occurrenceOutcome during scan (re-pollute)',rules:['aria-hidden-focus','image-alt-present'],
  html:page(`document.addEventListener('focusin',()=>{Object.prototype.occurrenceOutcome='pass';Object.prototype.outcome='pass'},true);`,focusBody+'<img src=a.png><img src=b.png>'),after:`()=>({oo:({}).occurrenceOutcome})`},
 {name:'H10 getter on Object.prototype (non-throwing)',rules:['html-lang-attr-present'],
  html:page(`Object.defineProperty(Object.prototype,'zqg',{get(){return 1},configurable:true});`,''),after:`()=>({g:({}).zqg})`},
 {name:'H11 occurrenceOutcome pass pollution, async entry',entry:'runa11yCoreInPageAsync',rules:['image-alt-present'],
  html:page(`Object.prototype.occurrenceOutcome='pass';Object.prototype.outcome='pass';`,'<img src=a.png>'),after:`()=>({oo:({}).occurrenceOutcome})`},
 {name:'H12 non-enumerable writable configurable value keeps descriptor',rules:['html-lang-attr-present'],
  html:page(`Object.defineProperty(Object.prototype,'ne',{value:5,writable:true,configurable:true,enumerable:false});`,''),after:`()=>Object.getOwnPropertyDescriptor(Object.prototype,'ne')`},
]);
