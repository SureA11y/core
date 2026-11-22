// Make every name the bundle assigns (x.name = / x["name"] =) a non-writable undefined on Object.prototype;
// scan; on a TypeError naming a key, record it, drop it, rerun. Then compare outcomes to a clean scan.
const fs=require('fs');process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const [tree='/home/user/r12-final',mode='jsdom',pageName='blog',optsJson='{}']=process.argv.slice(2);
const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const names=new Set();
for(const m of B.matchAll(/\.([A-Za-z_$][\w$]*)\s*(?:=(?!=)|\+=|-=|\|\|=|\?\?=|\+\+)/g))names.add(m[1]);
for(const m of B.matchAll(/\[\s*["']([A-Za-z_$][\w$]*)["']\s*\]\s*=(?!=)/g))names.add(m[1]);
const html=pageName.startsWith('<')?pageName:fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pageName+'.html','utf8');
const install=`(names)=>{const own=new Set(Object.getOwnPropertyNames(Object.prototype));const done=[];for(const n of names){if(own.has(n)||n==='__proto__')continue;try{Object.defineProperty(Object.prototype,n,{value:undefined,writable:false,enumerable:false,configurable:true});done.push(n)}catch(e){}}return done.length}`;
const scan=`(async(o)=>{let r;try{r=await a11ycore.runa11yCoreInPage(null,null,o,null);}catch(e){return {err:String(e.message).slice(0,300),code:e.code,stack:String(e.stack).split('\\n').slice(0,3).join(' / ').slice(0,300)}}
 const s={};for(const c of r.checksResults)s[c.ruleId]=c.outcome+':'+(c.occurrences||[]).map(x=>x.occurrenceOutcome).join(',')+(c.error?' ERR '+String(c.error.message||c.error).slice(0,140):'')+(c.data&&c.data.error?' DERR '+String(c.data.error).slice(0,140):'');return {s,warn:(r.engine&&r.engine.warnings||[]).length};})`;
async function once(list){const opts=JSON.parse(optsJson);
 if(mode==='jsdom'){const {JSDOM,VirtualConsole}=require(tree+'/node_modules/jsdom');const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);if(list)d.window.eval('('+install+')')(list);const r=await d.window.eval(scan)(opts);d.window.close();return r;}
 const {chromium}=require(tree+'/node_modules/playwright');global.br=global.br||await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await br.newPage();await p.setContent(html);await p.addScriptTag({content:B});if(list)await p.evaluate(`(${install})(${JSON.stringify(list)})`);const r=await p.evaluate(`${scan}(${JSON.stringify(opts)})`);await p.close();return r;}
(async()=>{const clean=await once(null);if(clean.err){console.log('clean err',clean.err);process.exit();}
 let list=[...names];const hits=[];
 for(let i=0;i<40;i++){const r=await once(list);
  if(r.err){const m=r.err.match(/read.only property '([^']+)'|Cannot assign to read only property '([^']+)'|property '([^']+)' of .* read.only|'([^']+)' is read-only/);const k=m&&(m[1]||m[2]||m[3]||m[4]);hits.push([k,r.err.slice(0,160),r.stack]);if(!k||!list.includes(k)){console.log('unparsed',r);break;}list=list.filter(x=>x!==k);continue;}
  const diff=Object.keys(clean.s).filter(k=>clean.s[k]!==r.s[k]).map(k=>k+': '+clean.s[k].slice(0,40)+' -> '+String(r.s[k]).slice(0,200));
  console.log(mode,tree,pageName.slice(0,20),'names',names.size,'throws',hits.length,'outcome diffs',diff.length);for(const h of hits)console.log('  THROW',h[0],'|',h[1].slice(0,120));for(const d of diff.slice(0,30))console.log('  DIFF',d);break;}
 if(global.br)await br.close();})();
