const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs');
const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
let browser;
async function getBrowser(){ if(!browser) browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); return browser;}
async function scan(html,{rules=null,ctxOpts={},setup=null,eo={},keepPage=false,colorScheme}={}){
  const b=await getBrowser();
  const ctx=await b.newContext({viewport:{width:1000,height:800},colorScheme,...ctxOpts});
  const p=await ctx.newPage();
  await p.setContent(html);
  if(setup) await p.evaluate(setup);
  await p.waitForTimeout(50);
  await p.addScriptTag({content:BUNDLE});
  const out=await p.evaluate(([rules,eo])=>{
    try{
    const r=window.a11ycore.runa11yCoreInPage(location.href,null,eo,null);
    const o={};
    for(const c of r.checksResults){ if(rules && !rules.includes(c.ruleId)) continue;
      o[c.ruleId]={outcome:c.outcome,occ:(c.occurrences||[]).map(x=>({o:x.outcome,sel:x.selector||x.target,html:(x.html||'').slice(0,140),msg:(x.message||'').slice(0,260),unc:x.uncertainty&&x.uncertainty.code,data:x.data}))};}
    return o;}catch(e){return {CRASH:String(e&&e.stack||e)}}
  },[rules,eo]);
  if(keepPage) return {out,p,ctx};
  await ctx.close();
  return out;
}
function brief(out,ids){ const s=[]; for(const id of ids){const r=out[id]; if(!r){s.push(id+': (missing)');continue;} s.push(id+': '+r.outcome); for(const x of r.occ) s.push('   ['+x.o+'] '+(x.unc?('{'+x.unc+'} '):'')+x.html.slice(0,90)+' :: '+x.msg.slice(0,200));} return s.join('\n');}
module.exports={scan,brief,getBrowser,close:()=>browser&&browser.close()};
