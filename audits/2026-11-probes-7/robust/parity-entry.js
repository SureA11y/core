// runa11yCoreOnHtml asserts the in-page runner (runa11yCoreInPage) and the Node runner (runDomRulesInPage) agree, under jsdom.
const {runa11yCoreOnHtml}=require('/home/user/core/src/testing.js');const G=require('./gen.js');const fs=require('fs');console.warn=()=>{};
const mode=process.argv[2],from=+process.argv[3],to=+process.argv[4];
const FIX='/home/user/core/tests/fixtures';const files=fs.readdirSync(FIX).filter(f=>f.endsWith('.html')).sort();
let ok=0,bad=0;
(async()=>{for(let i=from;i<to;i++){const html=mode==='gen'?G.make(i+9000,{budget:150,maxDepth:6}):G.mutate(fs.readFileSync(FIX+'/'+files[i%files.length],'utf8'),i*13+5);
 for(const eo of [{},{locale:'fr'},{includeHiddenElements:true}]){try{runa11yCoreOnHtml(html,{engineOptions:eo});ok++}catch(e){bad++;console.log(mode,i,JSON.stringify(eo),String(e.message).slice(0,600))}}
 await new Promise(r=>setImmediate(r));}
console.log({mode,ok,bad});})();
