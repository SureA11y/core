// node g3-one.js tree mode name[,name] [page]  -> scan with those names read-only on Object.prototype
const fs=require('fs');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const [tree,mode,list,pg='blog',kind='ro']=process.argv.slice(2);
const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const html=pg.startsWith('<')?pg:pg.endsWith('.html')?fs.readFileSync(pg,'utf8'):fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');
const names=list?list.split(','):[];
const install=`(names,kind)=>{for(const n of names){if(kind==='ro')Object.defineProperty(Object.prototype,n,{value:undefined,writable:false,configurable:true});else Object.prototype[n]=JSON.parse(kind);}}`;
const scan=`(async()=>{let r;try{r=await a11ycore.runa11yCoreInPage(null,null,{},null);}catch(e){return {err:String(e.message).slice(0,200),code:e.code||null,name:e.name}}
 const s={};for(const c of r.checksResults)s[c.ruleId]=c.outcome+':'+(c.occurrences||[]).map(x=>x.occurrenceOutcome).join(',')+(c.error?' ERR '+String(c.error.message||c.error).slice(0,100):'');return {n:r.checksResults.length,s,inc:r.engine&&r.engine.incomplete,w:(r.engine&&r.engine.warnings||[]).map(String).slice(0,3)};})`;
(async()=>{let base,res;
 if(mode==='jsdom'){const {JSDOM,VirtualConsole}=require('/home/user/r12-final/node_modules/jsdom');const run=async(l)=>{const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);d.window.eval('('+install+')')(l,kind);const r=await d.window.eval(scan)();d.window.close();return r;};base=await run([]);res=await run(names);}
 else{const {chromium}=require('/home/user/r12-final/node_modules/playwright');const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const run=async(l)=>{const p=await br.newPage();await p.setContent(html);await p.addScriptTag({content:B});await p.evaluate(`(${install})(${JSON.stringify(l)},${JSON.stringify(kind)})`);const r=await p.evaluate(scan);await p.close();return r;};base=await run([]);res=await run(names);await br.close();}
 if(res.err){console.log(mode,tree.split('/').pop(),list,'THROW',res.name,res.code,res.err.slice(0,130));return;}
 const diff=Object.keys(base.s).filter(k=>base.s[k]!==res.s[k]).map(k=>k+': '+base.s[k].slice(0,30)+' -> '+String(res.s[k]).slice(0,130));
 console.log(mode,tree.split('/').pop(),list,'rules',base.n,'->',res.n,'diffs',diff.length,res.inc?JSON.stringify(res.inc).slice(0,100):'');for(const d of diff.slice(0,8))console.log('   ',d);
})();
