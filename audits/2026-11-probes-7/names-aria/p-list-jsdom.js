const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
(async()=>{ for (const h of ['<div role=list><li>a</li><li>b</li></div>','<div role=list><li>a</li></div>']) {
 const r = await runa11yCoreOnHtml(`<!doctype html><html lang=en><head><title>x</title></head><body><main>${h}</main></body></html>`, { rules: { include: ['aria-required-children','listitem-parent-valid'] } });
 for (const c of r.checksResults) console.log(h, c.ruleId, c.outcome, (c.occurrences||[]).map(o=>o.data.details.reasonCode+' '+JSON.stringify(o.data.uncertainty||null)));
 await new Promise(r=>setImmediate(r)); }})();
