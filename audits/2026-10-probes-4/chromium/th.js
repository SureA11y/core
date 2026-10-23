const {getBrowser}=require('./h.js');
const fs=require('fs');const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
async function run(html,rules,{setup,wait=50,eo={},viewport={width:1000,height:800},scroll}={}){
  const b=await getBrowser();const ctx=await b.newContext({viewport});const p=await ctx.newPage();
  await p.setContent(html); if(setup) await p.evaluate(setup); await p.waitForTimeout(wait);
  if(scroll) await p.evaluate(scroll);
  const geo=await p.evaluate(()=>{const o={};for(const el of document.querySelectorAll('[data-t]')){const r=el.getBoundingClientRect();o[el.id]=`${r.width.toFixed(1)}x${r.height.toFixed(1)}`;}return o;});
  await p.addScriptTag({content:BUNDLE});
  const eng=await p.evaluate(([rules,eo])=>{try{const r=window.a11ycore.runa11yCoreInPage(location.href,null,eo,null);const o={_rule:{}};
    for(const id of rules){const c=r.checksResults.find(x=>x.ruleId===id);o._rule[id]=c?c.outcome:'missing';
      for(const oc of (c&&c.occurrences)||[]){let el=null;try{el=document.querySelector(oc.selector)}catch{} if(!el&&oc.selector&&oc.selector.includes('>>>')){} const h=el&&el.closest('[data-t]');const k=h?h.id:'?'+(oc.selector||'').slice(-60);
        (o[k]=o[k]||[]).push({rule:id,kind:(oc.uncertainty?'cantTell':'fail'),unc:oc.uncertainty&&oc.uncertainty.code,s:(oc.summary||'').slice(0,220)});}}
    return o;}catch(e){return {CRASH:String(e.stack||e)}}},[rules,eo]);
  await ctx.close(); return {eng,geo};
}
function rep(title,res,exp){const L=['## '+title];if(res.eng.CRASH){L.push('CRASH '+res.eng.CRASH);return L.join('\n');}
 L.push('rule outcomes: '+JSON.stringify(res.eng._rule));
 for(const id of Object.keys({...exp,...res.eng})){if(id==='_rule')continue;const list=res.eng[id]||[];const v=list.some(x=>x.kind==='fail')?'FAIL':list.length?'cantTell':'pass';const ex=exp[id]||'?';
  const flag=(/^pass/.test(ex)&&v==='FAIL')?'  <<< FALSE FAIL':(/^fail/.test(ex)&&v==='pass')?'  <<< MISSED':'';
  L.push(`${id}: expect=${ex} engine=${v} geo=${res.geo[id]||''}${flag}`);for(const x of list)L.push(`    ${x.rule} ${x.kind} ${x.unc||''} :: ${x.s}`);}
 return L.join('\n');}
module.exports={run,rep};
