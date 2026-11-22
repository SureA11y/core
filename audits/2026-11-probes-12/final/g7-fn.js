// Function values on Object.prototype (as libraries add methods): does the scan change?
const fs=require('fs');const {JSDOM,VirtualConsole}=require('/home/user/r12-final/node_modules/jsdom');
const html=`<!doctype html><html lang=en><head><title>Shop page</title><style>.lo{color:#999}button:focus{outline:none}</style></head><body><main><h1>Title</h1><img src=a.png><p class=lo>Low contrast</p><div aria-hidden=true><a href=#z>hidden link</a></div><input type=text><button></button><div role=button onclick="x()">Go</div><ul role=navigation><li><a href=#>a</a></li></ul></main></body></html>`;
async function run(tree,names,body,async){const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);
 for(const n of names)d.window.eval(`Object.defineProperty(Object.prototype,${JSON.stringify(n)},{value:function(){${body}},writable:true,configurable:true,enumerable:false})`);
 let r;try{r=await Promise.race([async?d.window.eval('a11ycore.runa11yCoreInPageAsync(null,null,{},null)'):d.window.a11ycore.runa11yCoreInPage(null,null,{},null),new Promise(z=>setTimeout(()=>z('TIMEOUT'),20000))]);}catch(e){return 'THROW '+e.message.slice(0,100);}
 if(r==='TIMEOUT')return r;const s={};for(const c of r.checksResults)s[c.ruleId]=c.outcome;d.window.close();return s;}
(async()=>{const names=(process.argv[2]||'').split(',').filter(Boolean);
 for(const tree of ['/home/user/core','/home/user/r12-final']){const base=await run(tree,[],'',false);
  for(const a of [false,true]){const r=await run(tree,names,process.argv[3]||'return this',a);if(typeof r==='string'){console.log(tree,a?'async':'sync',r);continue;}
   const diff=Object.keys(base).filter(k=>base[k]!==r[k]).map(k=>k+' '+base[k]+'->'+r[k]);console.log(tree.split('/').pop(),a?'async':'sync',names.join(','),'diffs',diff.length,diff.slice(0,8).join('; '));}}})();
