const {getBrowser}=require('./h.js');
const fs=require('fs');const BUNDLE=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
// targets: {key: jsExpression returning element}
async function run(html,targets,{setup,wait=50,eo={},ignore=[]}={}){
  const b=await getBrowser();const ctx=await b.newContext({viewport:{width:1000,height:800}});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.setContent(html); if(setup) await p.evaluate(setup); await p.waitForTimeout(wait);
  const cdp=await ctx.newCDPSession(p); await cdp.send('DOM.enable');await cdp.send('Accessibility.enable');
  const ax={};
  for(const [k,expr] of Object.entries(targets)){
    try{const {result}=await cdp.send('Runtime.evaluate',{expression:expr});
      if(!result.objectId){ax[k]='(no element)';continue;}
      const {node}=await cdp.send('DOM.describeNode',{objectId:result.objectId});
      const {nodes}=await cdp.send('Accessibility.getPartialAXTree',{backendNodeId:node.backendNodeId,fetchRelatives:false});
      const n=nodes[0]; ax[k]=n.ignored?`IGNORED(${(n.ignoredReasons||[]).map(r=>r.name).join(',')})`:`${n.role&&n.role.value} "${n.name&&n.name.value||''}"`;
    }catch(e){ax[k]='ERR '+e.message}
  }
  await p.addScriptTag({content:BUNDLE});
  const eng=await p.evaluate(([eo,ignore])=>{try{const r=window.a11ycore.runa11yCoreInPage(location.href,null,eo,null);const out=[];
    for(const c of r.checksResults){ if(ignore.includes(c.ruleId)) continue; if(c.outcome==='pass'||c.outcome==='notApplicable') continue;
      for(const oc of c.occurrences||[]) out.push(`${c.ruleId} [${oc.uncertainty?('cantTell:'+oc.uncertainty.code):'fail'}] ${oc.selector||''} :: ${(oc.html||'').slice(0,100)} :: ${(oc.summary||'').slice(0,160)}`);
      if(!(c.occurrences||[]).length) out.push(`${c.ruleId} [${c.outcome}] (no occurrences)`);}
    return out;}catch(e){return ['CRASH '+String(e.stack||e)]}},[eo,ignore]);
  await ctx.close(); return {ax,eng,errs};
}
function rep(title,r){return ['## '+title,'AX (Chromium ground truth):',...Object.entries(r.ax).map(([k,v])=>`  ${k}: ${v}`),'engine non-pass occurrences:',...r.eng.map(x=>'  '+x),...(r.errs.length?['pageerrors: '+r.errs.join(' | ')]:[])].join('\n');}
module.exports={run,rep};
