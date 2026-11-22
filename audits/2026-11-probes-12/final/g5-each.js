// Each assigned name, alone, read-only on Object.prototype: scan-level throw or per-rule diffs.
const fs=require('fs');const tree=process.argv[2];const pg=process.argv[3]||'blog';const B=fs.readFileSync(tree+'/surea11y.browser.js','utf8');
const html=fs.readFileSync('/tmp/surea11y-audit/r12/api/perf/page-'+pg+'.html','utf8');
const names=new Set();for(const m of B.matchAll(/\.([A-Za-z_$][\w$]*)\s*(?:=(?!=)|\+=|-=|\|\|=|\?\?=|\+\+)/g))names.add(m[1]);for(const m of B.matchAll(/\[\s*["']([A-Za-z_$][\w$]*)["']\s*\]\s*=(?!=)/g))names.add(m[1]);
const {JSDOM,VirtualConsole}=require('/home/user/r12-final/node_modules/jsdom');
function run(n){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:new VirtualConsole()});d.window.eval(B);
 if(n){if(Object.getOwnPropertyNames(d.window.Object.prototype).includes(n)){d.window.close();return null;}d.window.Object.defineProperty(d.window.Object.prototype,n,{value:undefined,writable:false,configurable:true});}
 let r;try{r=d.window.a11ycore.runa11yCoreInPage(null,null,{},null);}catch(e){d.window.close();return {err:(e.code||'bare '+e.name)+' '+e.message.slice(0,90)};}
 const s={};for(const c of r.checksResults)s[c.ruleId]=c.outcome+':'+(c.occurrences||[]).map(x=>x.occurrenceOutcome).join(',')+(c.error?' ERR '+String(c.error.message||c.error).slice(0,90):'');d.window.close();return {s};}
const base=run(null);let ok=0;
for(const n of names){if(n==='__proto__')continue;const r=run(n);if(!r)continue;if(r.err){console.log('THROW',n,'|',r.err);continue;}
 const diff=Object.keys(base.s).filter(k=>base.s[k]!==r.s[k]);if(diff.length)console.log('DIFF',n,diff.length,'|',diff.slice(0,4).map(k=>k+' '+String(r.s[k]).slice(-90)).join(' ;; '));else ok++;}
console.log('names',names.size,'clean',ok);
