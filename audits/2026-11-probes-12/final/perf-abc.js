// node abc.js pages reps builds [rules] -> wall and renderer CPU (SystemInfo) per scan; per-rule medians. Appends JSON lines to $OUT.
const http=require('http'),fs=require('fs');
const {chromium}=require('/home/user/r12-final/node_modules/playwright');
const S=__dirname;
const ALL={v117:'/home/user/core-v117/surea11y.browser.js',main:'/home/user/core/surea11y.browser.js',final:'/home/user/r12-final/surea11y.browser.js'};

const [pgs,reps=5,bl='v117,r8,base',ro]=process.argv.slice(2);
const B=bl.split(',');const bundles=Object.fromEntries(B.map(k=>[k,fs.readFileSync(ALL[k])]));
let html;
const srv=http.createServer((q,s)=>{const m=q.url.match(/^\/b\/([\w-]+)\.js/);if(m){s.setHeader('content-type','text/javascript');return s.end(bundles[m[1]]);}if(q.url!=='/'){s.statusCode=404;return s.end();}s.setHeader('content-type','text/html');s.end(html);});
const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];
(async()=>{await new Promise(r=>srv.listen(0,r));const port=srv.address().port;
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const bcdp=await br.newBrowserCDPSession();
const cpu=async()=>{const {processInfo}=await bcdp.send('SystemInfo.getProcessInfo');let s=0;for(const p of processInfo)if(p.type==='renderer')s+=p.cpuTime;return s*1000;};
const ctx=await br.newContext({viewport:{width:1280,height:900}});
for(const pg of pgs.split(',')){html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html');
const res={};
for(let i=0;i<+reps;i++)for(const b of B.slice(i%B.length).concat(B.slice(0,i%B.length))){
 const p=await ctx.newPage();await p.goto(`http://127.0.0.1:${port}/`);await p.addScriptTag({url:`/b/${b}.js`});
 await p.evaluate(()=>new Promise(r=>setTimeout(r,50)));
 const c0=await cpu();
 const r=await p.evaluate((ro)=>{const t0=performance.now();const r=a11ycore.runa11yCoreInPage(location.href,null,{perfStats:true,profileRules:true},ro);const tot=performance.now()-t0;const ps=r.perfStats||{};return {tot,warm:ps.warmUpMs||0,rt:ps.ruleTimings||{}};},ro?ro.split(','):null);
 const c1=await cpu();
 const R=(res[b]=res[b]||{tot:[],cpu:[],ov:[],rt:{}});R.tot.push(r.tot);R.cpu.push(c1-c0);let s=0;for(const[k,v]of Object.entries(r.rt)){s+=v;(R.rt[k]=R.rt[k]||[]).push(v);}R.ov.push(r.tot-s);
 await p.close();}
const o={};for(const b of B){const R=res[b];o[b]={tot:med(R.tot),cpu:med(R.cpu),ov:med(R.ov),rt:Object.fromEntries(Object.entries(R.rt).map(([k,v])=>[k,med(v)]))};}
fs.appendFileSync(process.env.OUT||'/tmp/surea11y-audit/r12/final/perf.jsonl',JSON.stringify({pg,o})+'\n');
console.log(pg,B.map(b=>`${b}=${o[b].tot.toFixed(0)}/cpu ${o[b].cpu.toFixed(0)}(ov ${o[b].ov.toFixed(0)})`).join(' '));}
await br.close();srv.close();})();
