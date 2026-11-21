// jsdom: does a removed subtree survive GC after a scan, once window.__a11ycoreSharedCache is deleted? Compare with no scan.
const L=require('./lib.js');const {kinds}=require('./perf-pages.js');console.warn=()=>{};
const mode=process.argv[2];
const tick=()=>new Promise(r=>setImmediate(r));
async function gcAll(){for(let i=0;i<6;i++){await tick();global.gc();}}
(async()=>{const html=kinds.mixed(300);const dom=L.open(html);const w=dom.window;
if(mode!=='noscan'){ if(mode==='only') L.scanJsdom(html,{},{includeRuleIds:[process.argv[3]]},dom); else L.scanJsdom(html,{},null,dom);}
let main=w.document.querySelector('main');const ref=new WeakRef(main);main.remove();main=null;
delete w.__a11ycoreSharedCache;await gcAll();
console.log(mode,process.argv[3]||'','removed <main> alive:',!!ref.deref());})();
