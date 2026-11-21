'use strict';
// After scans (and the console helpers), do page elements carry properties or symbols the engine put on them?
const C=require('./chrome-lib.js');const {kinds}=require('./perf-pages.js');
(async()=>{const b=await C.launch();const p=await b.newPage();await p.setContent(kinds.mixed(300).replace('</main>','<div id="h"><template shadowrootmode="open"><button></button></template></div><x-el></x-el></main>'));await p.evaluate(C.BUNDLE);
const snap=()=>p.evaluate(()=>{const out={};const all=[document,window,...document.querySelectorAll('*'),document.getElementById('h').shadowRoot,...document.getElementById('h').shadowRoot.querySelectorAll('*')];for(const e of all){const k=Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e).map(String));for(const x of k)out[x]=(out[x]||0)+1}return out});
const s0=await snap();
await p.evaluate(async()=>{const a=window.a11ycore;console.table=()=>{};console.log=()=>{};a.runa11yCoreInPage(null,null,{},null);const r=await a.run();a.highlight(r);a.clearHighlights();await a.inspect('names',{});a.clearHighlights();});
const s1=await snap();const diff=Object.fromEntries(Object.entries(s1).filter(([k,v])=>s0[k]!==v));
const attrs=await p.evaluate(()=>[...document.querySelectorAll('*')].flatMap(e=>[...e.attributes].map(a=>a.name)).filter(n=>/a11y|surea11y/i.test(n)));
console.log(JSON.stringify({newOwnProps:diff,leftoverAttrs:attrs.slice(0,5),styleEls:await p.evaluate(()=>document.querySelectorAll('style').length)}));await b.close();})();
