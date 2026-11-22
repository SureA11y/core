// Four-way: jsdom/Chromium x main/now. A case gives html (with scripts), and an
// 'after' function source evaluated in the page after the scan that returns a JSON value.
const fs=require('fs');
const TREES={main:'/home/user/core',now:'/home/user/r12-review',v117:'/home/user/core-v117'};
process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const {JSDOM,VirtualConsole}=require('/home/user/r12-review/node_modules/jsdom');
const bundles={};const B=t=>bundles[t]=bundles[t]||fs.readFileSync(TREES[t]+'/surea11y.browser.js','utf8');
async function jsdomRun(tree,c){
  const vc=new VirtualConsole();const errs=[];vc.on('jsdomError',e=>errs.push(String(e.message||e).slice(0,150)));
  const dom=new JSDOM(c.html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:vc});
  const w=dom.window;w.eval(B(tree));
  if(c.setup)w.eval('('+c.setup+')()');
  let out={};try{const r=await w.eval(`(async()=>{const o=${JSON.stringify(c.opts||{})};return a11ycore.${c.entry||'runa11yCoreInPage'}(null,null,o,${JSON.stringify(c.runOnly||null)})})()`);out.res=summ(r,c.rules);}catch(e){out.err=String(e&&e.message||e).slice(0,200)+(e&&e.code?' ['+e.code+']':'');}
  if(c.after)try{out.after=w.eval('('+c.after+')()');}catch(e){out.after='THREW '+e.message}
  if(errs.length)out.pageErrors=errs;dom.window.close();return out;}
function summ(r,rules){if(!r||!r.checksResults)return r;const o={};for(const x of r.checksResults){if(rules&&!rules.includes(x.ruleId))continue;o[x.ruleId]=x.outcome+':'+(x.occurrences||[]).map(y=>y.occurrenceOutcome).join(',');}
  if(r.engine&&r.engine.incomplete&&Object.keys(r.engine.incomplete).length)o._incomplete=JSON.stringify(r.engine.incomplete).slice(0,200);return o;}
let browser;
async function chromeRun(tree,c){const {chromium}=require('/home/user/r12-review/node_modules/playwright');
  if(!browser)browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await browser.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message).slice(0,150)));
  if(c.route)await p.route('**/*',c.route);
  if(c.url){await p.goto(c.url);}else await p.setContent(c.html);await p.addScriptTag({content:B(tree)});
  if(c.setup)await p.evaluate('('+c.setup+')()');
  const out={};
  try{const r=await p.evaluate(`(async()=>{const o=${JSON.stringify(c.opts||{})};const r=await a11ycore.${c.entry||'runa11yCoreInPage'}(null,null,o,${JSON.stringify(c.runOnly||null)});return JSON.parse(JSON.stringify(r))})()`);out.res=summ(r,c.rules);}catch(e){out.err=String(e.message).slice(0,200);}
  if(c.after)try{out.after=await p.evaluate('('+c.after+')()');}catch(e){out.after='THREW '+e.message}
  if(errs.length)out.pageErrors=errs;await p.close();return out;}
async function run4(cases,{trees=['main','now'],modes=['jsdom','chrome']}={}){
  for(const c of cases){console.log('=== '+c.name);
    for(const m of modes)for(const t of trees){const r=await (m==='jsdom'?jsdomRun:chromeRun)(t,c);console.log(`  ${m}/${t}: ${JSON.stringify(r).slice(0,c.w||700)}`);}}
  if(browser){await browser.close();browser=null;}}
module.exports={run4,TREES};
