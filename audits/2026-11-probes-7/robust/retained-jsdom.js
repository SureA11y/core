// jsdom: heap held by window.__a11ycoreSharedCache after a scan returns, and detached nodes it keeps alive.
const L=require('./lib.js');const {kinds}=require('./perf-pages.js');console.warn=()=>{};
const n=+(process.argv[2]||3000);
const tick=()=>new Promise(r=>setImmediate(r));
async function heap(){for(let i=0;i<4;i++){await tick();global.gc();}return process.memoryUsage().heapUsed/1048576;}
(async()=>{const html=kinds.mixed(n);const dom=L.open(html);const w=dom.window;
const h0=await heap();L.scanJsdom(html,{},null,dom);const h1=await heap();
// detach main, keep a weak ref to it
let main=w.document.querySelector('main');const ref=new WeakRef(main);main.remove();main=null;
const h2=await heap();const aliveWithCache=!!ref.deref();
delete w.__a11ycoreSharedCache;const h3=await heap();const aliveAfter=!!ref.deref();
console.log(JSON.stringify({n,elements:w.document.getElementsByTagName('*').length,beforeScanMB:+h0.toFixed(1),afterScanMB:+h1.toFixed(1),afterRemovingMainMB:+h2.toFixed(1),removedMainStillAlive:aliveWithCache,afterDeletingCacheMB:+h3.toFixed(1),removedMainAliveAfterDelete:aliveAfter,retainedByCacheMB:+(h2-h3).toFixed(1)}));})();
