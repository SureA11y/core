const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();
for(const [kind,n] of [['images',1000],['images',2000],['images',4000],['links',4000]]){const p=await b.newPage();await p.setContent(kinds[kind](n));await C.inject(p);
const r=await p.evaluate(()=>{const d=Object.getOwnPropertyDescriptor(window,'scrollX')||Object.getOwnPropertyDescriptor(Window.prototype,'scrollX');let c=0;
Object.defineProperty(window,'scrollX',{configurable:true,get(){c++;return d.get.call(window)}});
const gcr=Range.prototype.getClientRects;let rc=0;Range.prototype.getClientRects=function(){rc++;return gcr.call(this)};
const t=performance.now();const res=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['text-spacing-content-loss']});
const tn=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let k=0;while(tn.nextNode())k++;
return {ms:performance.now()-t,scrollXReads:c,rangeRects:rc,textNodes:k,outcome:res.checksResults[0].outcome}});
console.log(kind,n,JSON.stringify(r));await p.close();}
await b.close();})();
