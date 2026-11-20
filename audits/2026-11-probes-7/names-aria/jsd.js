const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
async function run(html, rules, extra={}) {
  const doc = html.includes('<html') ? html : `<!doctype html><html lang=en><head><title>T</title></head><body>${html}</body></html>`;
  const r = await runa11yCoreOnHtml(doc, Object.assign({ rules: { include: rules } }, extra));
  await new Promise(r=>setImmediate(r));
  return r;
}
function show(id, r) {
  const out=[`== ${id}`];
  for (const c of r.checksResults) { out.push(` ${c.ruleId}: ${c.outcome}${c.error?' ERR '+String(c.error).slice(0,200):''}`); for (const o of c.occurrences||[]) out.push(`   [${o.occurrenceOutcome||c.outcome}] ${o.data&&o.data.details&&o.data.details.reasonCode} ${o.selector} :: ${o.summary} | ${(o.hint||'').slice(0,200)}`); }
  return out.join('\n');
}
module.exports={run,show};
