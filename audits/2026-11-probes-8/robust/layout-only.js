// Is the cost Chromium's own layout? Apply the same kind of spacing sheet without the engine and time one forced layout.
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();
for(const n of [1000,2500,5000,10000]){const p=await b.newPage();await p.setContent(kinds.images(n));
const r=await p.evaluate(()=>{document.body.offsetHeight;const s=document.createElement('style');s.textContent='@layer x{*{line-height:1.5 !important;letter-spacing:0.12em !important;word-spacing:0.16em !important}p{margin-bottom:2em !important}}';
let t=performance.now();document.head.appendChild(s);document.body.offsetHeight;const a=performance.now()-t;
t=performance.now();s.remove();document.body.offsetHeight;const c=performance.now()-t;
t=performance.now();document.head.appendChild(s);window.scrollX;const d=performance.now()-t; s.remove();
return {applyLayoutMs:a.toFixed(0),removeLayoutMs:c.toFixed(0),again:d.toFixed(0)}});
console.log(n,JSON.stringify(r));await p.close();}
await b.close();})();
