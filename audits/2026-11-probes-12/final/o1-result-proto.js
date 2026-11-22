// Every object in a result: prototype not null; JSON and structuredClone round trip.
const fs=require('fs');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const T={main:'/home/user/core',now:'/home/user/r12-final'};
const html=`<!doctype html><html lang=en><head><title>t</title><style>a:focus{outline:none}</style></head><body><main><h1>h</h1><img src=a.png><p style="color:#999">grey</p><a href=#>x</a><div aria-hidden=true><button>b</button></div><iframe srcdoc="<p>x</p>" title=f></iframe><input></main></body></html>`;
const fn=`async(opts)=>{const out={};for(const [k,o] of Object.entries(opts)){let r;try{r=await (k.startsWith('async')?a11ycore.runa11yCoreInPageAsync:a11ycore.runa11yCoreInPage)(null,null,o,null);}catch(e){out[k]='THROW '+e.message.slice(0,150);continue;}
 const bad=[];const seen=new Set();const walk=(v,p)=>{if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(Object.getPrototypeOf(v)===null)bad.push(p);if(typeof Node!=='undefined'&&v instanceof Node)return;for(const kk of Object.keys(v))walk(v[kk],p+'.'+kk);};walk(r,'r');
 let js='ok',sc='ok';try{JSON.stringify(r)}catch(e){js=e.message.slice(0,80)}try{structuredClone(r)}catch(e){sc=e.message.slice(0,80)}
 out[k]={nullProto:bad.slice(0,8),nNull:bad.length,json:js,clone:sc,hasOwn:typeof r.hasOwnProperty, occ0: (()=>{const c=r.checksResults.find(c=>c.occurrences&&c.occurrences.length);return c?typeof c.occurrences[0].hasOwnProperty:'-'})()};}
 return out;}`;
const opts={plain:{},multi:{profile:['wcag22-aa','wai-aria-1.2']},opts:{contrast:{mode:'auditorAssist'},rules:{exclude:['region']},probes:{a:{b:1}},output:{includeHtml:false}},async:{timeBudgetMs:60000}};
(async()=>{for(const t of Object.keys(T)){const B=fs.readFileSync(T[t]+'/surea11y.browser.js','utf8');
 const {JSDOM}=require('/home/user/r12-final/node_modules/jsdom');const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously'});d.window.eval(B);
 d.window.structuredClone=d.window.structuredClone||structuredClone;
 console.log('jsdom',t,JSON.stringify(await d.window.eval('('+fn+')')(opts)));
 const {chromium}=require('/home/user/r12-final/node_modules/playwright');const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await br.newPage();await p.setContent(html);await p.addScriptTag({content:B});
 console.log('chrome',t,JSON.stringify(await p.evaluate(`(${fn})(${JSON.stringify(opts)})`)));await br.close();}
 // node API
 for(const t of Object.keys(T)){const X=require(T[t]+'/src/testing.js');const W=console.warn;console.warn=()=>{};const r=X.runa11yCoreOnHtml(html,{entryPointParity:false,engineOptions:{profile:['wcag22-aa','wai-aria-1.2']}});console.warn=W;
  const bad=[];const seen=new Set();const walk=(v,p)=>{if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(Object.getPrototypeOf(v)===null)bad.push(p);if(v.nodeType)return;for(const k of Object.keys(v))walk(v[k],p+'.'+k)};walk(r,'r');
  let sc='ok';try{structuredClone(r)}catch(e){sc=e.message.slice(0,80)}console.log('node',t,bad.length,bad.slice(0,8),sc);}
})();
