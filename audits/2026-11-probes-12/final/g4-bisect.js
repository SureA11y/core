const fs=require('fs');const tree='/home/user/r12-final';const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-blog.html','utf8');
const names=new Set();for(const m of B.matchAll(/\.([A-Za-z_$][\w$]*)\s*(?:=(?!=)|\+=|-=|\|\|=|\?\?=|\+\+)/g))names.add(m[1]);for(const m of B.matchAll(/\[\s*["']([A-Za-z_$][\w$]*)["']\s*\]\s*=(?!=)/g))names.add(m[1]);
const skip=new Set(['__instance','atScanStart','paintContained','limit','sharedCache','animationsAtScanStart','paintContainedByContentVisibility','rollupIds','__proto__']);
const {JSDOM,VirtualConsole}=require(tree+'/node_modules/jsdom');
const target=process.argv[2]||'region';
async function bad(l){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);
 d.window.eval(`(l)=>{const own=new Set(Object.getOwnPropertyNames(Object.prototype));for(const n of l)if(!own.has(n))Object.defineProperty(Object.prototype,n,{value:undefined,writable:false,configurable:true})}`)(l);
 let r;try{r=d.window.a11ycore.runa11yCoreInPage(null,null,{},null);}catch(e){d.window.close();return 'throw '+e.message.slice(0,80);}d.window.close();return !r.checksResults.find(c=>c.ruleId===target);}
(async()=>{let L=[...names].filter(n=>!skip.has(n));console.log('all',await bad(L));
 while(L.length>1){const a=L.slice(0,L.length>>1),b=L.slice(L.length>>1);const ra=await bad(a);if(ra===true){L=a;continue;}const rb=await bad(b);if(rb===true){L=b;continue;}console.log('split needs both',ra,rb,a.length,b.length);break;}
 console.log('culprit',L.slice(0,10));})();
