// Harness: run HTML pages four ways (jsdom/Chromium x before/after). Usage:
// const h=require('./h.js'); await h.run4(cases) where cases=[{name, html, opts, rules:[..]}]
const fs=require('fs');
const TREES={before:'/home/user/core-r11',after:'/home/user/r11-perf-review'};
const sigOf=(r,rules)=>{const o={};for(const c of r.checksResults){if(rules&&!rules.includes(c.ruleId))continue;
 o[c.ruleId]=c.outcome+' '+JSON.stringify((c.occurrences||[]).map(x=>[x.selector||x.target||'',x.occurrenceOutcome||x.outcome||'',String(x.message||x.description||'').slice(0,90)]));}return o;};
async function jsdomRun(tree,c){const {JSDOM}=require(TREES.before+'/node_modules/jsdom');
 const core=require(TREES[tree]+'/src/core.js');
 const dom=new JSDOM(c.html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:c.scripts?'dangerously':undefined});
 global.window=dom.window;global.document=dom.window.document;
 if(c.before)c.before(dom.window);
 const opts=Object.assign({},c.opts||{});if(c.rules)opts.rules=Object.assign({include:c.rules},opts.rules||{});
 let out=[];for(let i=0;i<(c.repeat||1);i++){if(c.between&&i)c.between(dom.window);
  try{out.push(sigOf(await core.runDomRulesInPage(dom.window.location.href,null,opts,null),c.rules));}catch(e){out.push({err:String(e).slice(0,200)});}}
 dom.window.close();return out;}
let browser;const bundles={};
async function chromeRun(tree,c){const {chromium}=require(TREES.before+'/node_modules/playwright');
 if(!browser)browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 bundles[tree]=bundles[tree]||fs.readFileSync(TREES[tree]+'/surea11y.browser.js','utf8');
 const p=await browser.newPage({viewport:{width:1280,height:800}});await p.setContent(c.html);await p.addScriptTag({content:bundles[tree]});
 const opts=Object.assign({},c.opts||{});if(c.rules)opts.rules=Object.assign({include:c.rules},opts.rules||{});
 let out;try{out=await p.evaluate(async({opts,rules,repeat,between})=>{const res=[];for(let i=0;i<repeat;i++){if(between&&i)(new Function(between))();
   const r=await window.a11ycore.runa11yCoreInPage(null,null,opts,null);const o={};for(const c of r.checksResults){if(rules&&!rules.includes(c.ruleId))continue;
   o[c.ruleId]=c.outcome+' '+JSON.stringify((c.occurrences||[]).map(x=>[x.selector||x.target||'',x.occurrenceOutcome||x.outcome||'',String(x.message||x.description||'').slice(0,90)]));}res.push(o);}return res;},{opts,rules:c.rules,repeat:c.repeat||1,between:c.betweenSrc||null});}catch(e){out=[{err:String(e).slice(0,200)}];}
 await p.close();return out;}
async function run4(cases,{modes=['jsdom','chrome'],verbose=false}={}){
 for(const c of cases){for(const m of modes){const fn=m==='jsdom'?jsdomRun:chromeRun;
   const a=await fn('before',c),b=await fn('after',c);
   const diffs=[];for(let i=0;i<Math.max(a.length,b.length);i++){const A=a[i]||{},B=b[i]||{};for(const k of new Set([...Object.keys(A),...Object.keys(B)]))if(A[k]!==B[k])diffs.push(`  [scan${i}] ${k}\n    before: ${A[k]}\n    after:  ${B[k]}`);}
   console.log(`${c.name} ${m}: ${diffs.length?'DIFF':'same'}`);if(diffs.length)console.log(diffs.join('\n'));
   if(verbose&&!diffs.length)console.log('   ',JSON.stringify(a).slice(0,3000));}}
 if(browser){await browser.close();browser=null;}}
module.exports={run4,TREES};
