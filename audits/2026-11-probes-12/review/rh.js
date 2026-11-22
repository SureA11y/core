// Four-way harness: jsdom/Chromium x before/now. before = core-r8 unless c.base='v117'.
const fs=require('fs');
const TREES={r8:'/home/user/core',v117:'/home/user/core-v117',now:'/home/user/r12-review'};
process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const occ=(x)=>{const d=x.details||{};return [x.selector||x.target||'',x.occurrenceOutcome||x.outcome||'',((x.data||{}).details||{}).reasonCode||'',(x.lean||{}).toward||'',String(x.summary||'').slice(0,c_msglen)];};
let c_msglen=110;
function sig(r,rules,full){const o={};for(const c of r.checksResults){if(rules&&!rules.includes(c.ruleId))continue;
 o[c.ruleId]=c.outcome+(c.data&&c.data.reason?' ['+c.data.reason+']':'')+' '+JSON.stringify((c.occurrences||[]).map(full?(x=>x):occ));}return o;}
const loaded={};
async function jsdomRun(tree,c){const {JSDOM}=require('/home/user/r12-review/node_modules/jsdom');
 const core=loaded[tree]=loaded[tree]||require(TREES[tree]+'/src/core.js');
 const dom=new JSDOM(c.html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:/<script/.test(c.html)?'dangerously':undefined});
 global.window=dom.window;global.document=dom.window.document;
 const opts=Object.assign({},c.opts||{});if(c.rules)opts.rules=Object.assign({include:c.rules},opts.rules||{});
 let out;const t=Date.now();try{out=sig(await core.runDomRulesInPage(dom.window.location.href,null,opts,null),c.rules,c.full);}catch(e){out={err:String(e.stack).slice(0,400)};if(/no rule named/.test(out.err))out={};}
 out._ms=Date.now()-t;dom.window.close();return out;}
let browser;const bundles={};
async function chromeRun(tree,c){const {chromium}=require('/home/user/r12-review/node_modules/playwright');
 if(!browser)browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 bundles[tree]=bundles[tree]||fs.readFileSync(TREES[tree]+'/surea11y.browser.js','utf8');
 const p=await browser.newPage({viewport:c.viewport||{width:1280,height:800}});await p.setContent(c.html);await p.addScriptTag({content:bundles[tree]});
 if(c.setup)await p.evaluate(c.setup);
 const opts=Object.assign({},c.opts||{});if(c.rules)opts.rules=Object.assign({include:c.rules},opts.rules||{});
 let out;try{out=await p.evaluate(async({opts,rules,full,ml})=>{const t=performance.now();const r=await window.a11ycore.runa11yCoreInPage(null,null,opts,null);const o={};
   for(const c of r.checksResults){if(rules&&!rules.includes(c.ruleId))continue;
   o[c.ruleId]=c.outcome+(c.data&&c.data.reason?' ['+c.data.reason+']':'')+' '+JSON.stringify((c.occurrences||[]).map(x=>full?x:[x.selector||x.target||'',x.occurrenceOutcome||x.outcome||'',((x.data||{}).details||{}).reasonCode||'',(x.lean||{}).toward||'',String(x.summary||'').slice(0,ml)]));}
   o._ms=Math.round(performance.now()-t);return o;},{opts,rules:c.rules,full:!!c.full,ml:c_msglen});}catch(e){out={err:String(e).slice(0,300)};if(/no rule named/.test(out.err))out={};}
 await p.close();return out;}
async function run4(cases,{modes=['jsdom','chrome']}={}){
 for(const c of cases){const b=c.base||'r8';const res={};
  for(const m of modes){const fn=m==='jsdom'?jsdomRun:chromeRun;res[m]={now:await fn('now',c)};if(b!=='none')res[m].base=await fn(b,c);}
  const lines=[];const W=c.w||500;
  for(const k of new Set(modes.flatMap(m=>Object.keys(res[m].now)))){if(k==='_ms')continue;
   const J=res.jsdom&&res.jsdom.now[k],C=res.chrome&&res.chrome.now[k];
   const jb=res.jsdom&&res.jsdom.base&&res.jsdom.base[k],cb=res.chrome&&res.chrome.base&&res.chrome.base[k];
   const flags=[];if(J!==undefined&&C!==undefined&&J!==C)flags.push('J!=C');if(jb!==undefined&&jb!==J&&!(jb||'').startsWith?.('undefined'))flags.push('J:'+b+'!=now');if(cb!==undefined&&cb!==C)flags.push('C:'+b+'!=now');
   lines.push(` ${k} ${flags.join(' ')}`);
   if(J===C)lines.push(`   now(J=C): ${String(C).slice(0,W)}`);else{lines.push(`   now J: ${String(J).slice(0,W)}`);lines.push(`   now C: ${String(C).slice(0,W)}`);}
   if(jb!==undefined&&jb!==J)lines.push(`   ${b} J: ${String(jb).slice(0,W)}`);
   if(cb!==undefined&&cb!==C)lines.push(`   ${b} C: ${String(cb).slice(0,W)}`);}
  console.log('=== '+c.name+(c.time?` ms J ${res.jsdom?.base?._ms}->${res.jsdom?.now._ms} C ${res.chrome?.base?._ms}->${res.chrome?.now._ms}`:''));console.log(lines.join('\n'));}
 if(browser){await browser.close();browser=null;}}
module.exports={run4,jsdomRun,chromeRun,TREES,setMsg:n=>c_msglen=n};
