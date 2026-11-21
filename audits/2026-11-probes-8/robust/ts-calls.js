'use strict';
// Count layout-reading calls text-spacing-content-loss makes on a gallery of N images, and its time.
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');Object.assign(kinds,require('./perf-pages2.js').kinds);
(async()=>{const b=await C.launch();for(const n of [1000,2000,4000]){const p=await b.newPage();await p.setContent(kinds[process.argv[2]||'gallery'](n));await p.evaluate(C.BUNDLE);
const r=await p.evaluate(()=>{const cnt={};const wrap=(proto,name)=>{const d=Object.getOwnPropertyDescriptor(proto,name);if(d.get){Object.defineProperty(proto,name,{...d,get(){cnt[name]=(cnt[name]||0)+1;return d.get.call(this)}})}else{const f=d.value;proto[name]=function(...a){cnt[name]=(cnt[name]||0)+1;return f.apply(this,a)}}};
const sx=Object.getOwnPropertyDescriptor(window,'scrollX');Object.defineProperty(window,'scrollX',{configurable:true,get(){cnt.scrollX=(cnt.scrollX||0)+1;return sx.get.call(window)}});
wrap(Element.prototype,'getBoundingClientRect');wrap(Range.prototype,'getClientRects');wrap(HTMLElement.prototype,'offsetWidth');wrap(Element.prototype,'clientWidth');wrap(Element.prototype,'scrollWidth');
const t=performance.now();const res=window.a11ycore.runa11yCoreInPage(null,null,{},{includeRuleIds:['text-spacing-content-loss']});return {ms:Math.round(performance.now()-t),cnt,o:res.checksResults[0].outcome}});
console.log(n,JSON.stringify(r));await p.close();}await b.close();})();
