const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
function probe(label, html, rules, opts={}) {
  let r;
  try { r = run(html, { runOnly: rules, ...opts }); } catch (e) { console.log(label, 'THROW', e.message); return; }
  const res = r.checksResults;
  const list = Array.isArray(res) ? res : Object.values(res);
  for (const x of list) {
    if (!rules.includes(x.ruleId)) continue;
    const occ = (x.occurrences||[]).map(o => `[${o.outcome||''}] ${(o.html||'').slice(0,80)} :: ${(o.summary||'').slice(0,120)}`);
    console.log(`${label} | ${x.ruleId} => ${x.outcome}${x.error? ' ERR:'+x.error:''}`);
    occ.forEach(s=>console.log('    '+s));
  }
}
module.exports = probe;
const { createDom, runa11yCoreOnDom } = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
module.exports.dom = function(label, html, setup, rules, opts={}) {
  const dom = createDom(html); setup(dom.window.document, dom.window);
  let r; try { r = runa11yCoreOnDom(dom, { runOnly: rules, ...opts }); } catch(e) { console.log(label,'THROW',e.message); return; }
  for (const x of r.checksResults) { if (!rules.includes(x.ruleId)) continue;
    console.log(`${label} | ${x.ruleId} => ${x.outcome}${x.error?' ERR:'+x.error:''}`);
    (x.occurrences||[]).forEach(o=>console.log(`    ${(o.html||'').slice(0,80)} :: ${(o.summary||'').slice(0,120)}`)); }
};
