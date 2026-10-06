const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml');
module.exports = function out(name, html, rules, opts={}){
  let r; try { r = run(html.startsWith('<!doctype')?html:`<!doctype html><html lang="en"><head><title>t</title><style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}</style></head><body>${html}</body></html>`, {runOnly: rules, entryPointParity:false, ...opts}); } catch(e){ console.log(name,'THROW',e.message.slice(0,200)); return; }
  for (const x of (r.checksResults||[]).filter(Boolean)) { if(!rules.includes(x.ruleId)) continue; console.log(name.padEnd(8), x.ruleId.padEnd(36), x.outcome, (x.occurrences||[]).map(o=>(o.outcome||'')+':'+(o.data?.details?.reasonCode||o.summary||'').slice(0,60)).join(' | ').slice(0,200), x.error||''); }
  return r;
};
