// Install undefined-returning recording getters on Object.prototype for every
// identifier the bundle uses; scan; report reads through the chain whose
// receiver is a plain object or array (the engine's own data).
const fs=require('fs');
process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const tree=process.argv[2]||'/home/user/r12-final', mode=process.argv[3]||'jsdom', pageName=process.argv[4]||'composite', optsJson=process.argv[5]||'{}';
const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const names=new Set();
for(const m of B.matchAll(/\.([A-Za-z_$][\w$]*)/g))names.add(m[1]);
for(const m of B.matchAll(/['"]([A-Za-z_$][\w$]{1,40})['"]/g))names.add(m[1]);
const html=pageName.endsWith('.html')?fs.readFileSync(pageName,'utf8'):fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pageName+'.html','utf8');
const install=`(names)=>{const own=new Set(Object.getOwnPropertyNames(Object.prototype));window.__rec=new Map();window.__on=false;
 const OP=Object.prototype, gp=Object.getPrototypeOf, ts=Object.prototype.toString, isArr=Array.isArray;
 for(const n of names){if(own.has(n)||['__proto__','get','set','value','writable','enumerable','configurable'].includes(n))continue;try{Object.defineProperty(OP,n,{configurable:true,enumerable:false,get(){ if(window.__on){const p=gp(this);let k=null;if(p===OP)k='plain';else if(isArr(this))k='array';else if(p===Function.prototype)k='function';
   if(k){const key=n+'|'+k;let e=window.__rec.get(key);if(!e){e={c:0,s:[]};window.__rec.set(key,e);}e.c++;if(e.s.length<2){window.__on=false;const st=String(new Error().stack).split('\\n').slice(2,4).map(l=>(l.match(/<anonymous>:(\\d+:\\d+)\\)?\\s*$/)||l.match(/surea11y[^:]*:(\\d+:\\d+)/)||[,'?'])[1]).join(' < ');window.__on=true;e.s.push(st.replace(/\\s+/g,' ').slice(0,300));}}}
   return undefined;},set(v){Object.defineProperty(this,n,{value:v,writable:true,enumerable:true,configurable:true});}});}catch(e){}}}`;
const scan=`(async(o)=>{window.__on=true;let r,err;try{r=await a11ycore.runa11yCoreInPage(null,null,o,null);}catch(e){err=String(e.message).slice(0,200)}window.__on=false;
 const out=[...window.__rec].map(([k,v])=>[k,v.c,v.s]);return {err,n:r&&r.checksResults.length,out};})`;
(async()=>{let res;const opts=JSON.parse(optsJson);
 if(mode==='jsdom'){const {JSDOM,VirtualConsole}=require(tree+'/node_modules/jsdom');const vc=new VirtualConsole();
  const dom=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:vc});const w=dom.window;w.eval(B);
  w.eval('('+install+')')([...names]);res=await w.eval(scan)(opts);}
 else{const {chromium}=require(tree+'/node_modules/playwright');const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await br.newPage();
  await p.setContent(html);await p.addScriptTag({content:B});await p.evaluate(`(${install})(${JSON.stringify([...names])})`);res=await p.evaluate(`${scan}(${JSON.stringify(opts)})`);await br.close();}
 console.log('err',res.err,'rules',res.n,'chain reads',res.out.length);
 res.out.sort((a,b)=>b[1]-a[1]);for(const [k,c,s] of res.out){const loc=s[0].split(' < ')[0];const [L,C]=loc.split(':').map(Number);const line=B.split('\n')[L-1]||'';console.log(k,c,s.join(' | '),'\n     >> '+line.slice(Math.max(0,C-140),C+60).replace(/\s+/g,' '));}
})();
