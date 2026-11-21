'use strict';
// Without the engine: add the WCAG 1.4.12 spacing style to a gallery of N (broken) images and force one layout.
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');Object.assign(kinds,require('./perf-pages2.js').kinds);
(async()=>{const b=await C.launch();for(const kind of ['gallery','inlineimgs','blockps'])for(const n of [1000,2000,4000,8000]){const p=await b.newPage();await p.setContent(kinds[kind](n));
const ms=await p.evaluate(()=>{document.body.offsetHeight;const t=performance.now();const s=document.createElement('style');s.textContent='*{line-height:1.5 !important;letter-spacing:0.12em !important;word-spacing:0.16em !important} p{margin-bottom:2em !important}';document.head.appendChild(s);document.body.offsetHeight;const t1=performance.now();s.remove();document.body.offsetHeight;return [Math.round(t1-t),Math.round(performance.now()-t1)]});
console.log(kind,n,'apply+layout ms',ms[0],'remove+layout ms',ms[1]);await p.close();}await b.close();})();
