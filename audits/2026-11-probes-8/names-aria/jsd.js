const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
async function jrun(html, rules, opts={}) {
  const doc = /<html/i.test(html) ? html : `<!doctype html><html lang="en"><head><title>T</title></head><body><main>${html}</main></body></html>`;
  const r = await runa11yCoreOnHtml(doc, Object.assign({ runOnly: rules||undefined }, opts));
  return r.checksResults.map(x=>({ruleId:x.ruleId,outcome:x.outcome,error:x.error&&String(x.error.message||x.error),occ:(x.occurrences||[]).map(o=>{const d=(o.data&&o.data.details)||{};return {sel:o.selector,oc:o.occurrenceOutcome||x.outcome,rc:d.reasonCode,sum:o.summary,lean:o.lean,name:d.refs&&d.refs.accessibleName&&d.refs.accessibleName.value}})}));
}
function jsum(id,res,showPass=false){ const l=[`== ${id} (jsdom)`]; for(const r of res){ if(r.error) l.push('  ERR '+r.ruleId+': '+r.error.slice(0,300)); for(const o of r.occ) if(showPass||(o.oc!=='pass'&&o.oc!=='notApplicable')) l.push(`  ${r.ruleId} [${o.oc}${o.lean?'/'+o.lean:''}] ${o.rc} ${o.sel} name=${JSON.stringify(o.name)} :: ${o.sum}`);} return l.join('\n'); }
module.exports={jrun,jsum};
