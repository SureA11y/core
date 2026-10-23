// node min-nomatch.js <seed> <rule>: minimise a page where an occurrence's selector matches nothing.
const { gen } = require('./gen5.js'); const { minimize } = require('./minimize.js');
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js'); console.warn = () => {};
const [seed, rule] = [+process.argv[2], process.argv[3]];
function bad(html) {
  const dom = createDom(html); const doc = dom.window.document;
  let r; try { r = runa11yCoreOnDom(dom, { entryPointParity: false, runOnly: { includeRuleIds: [rule] } }); } catch { return false; }
  const c = r.checksResults.find(x => x.ruleId === rule); let b = false;
  for (const o of c.occurrences) { if (!o.selector || (o.shadowHostSelectors || []).length) continue; let el = null; try { el = doc.querySelector(o.selector); } catch { } if (!el) { b = o.selector; break; } }
  dom.window.close(); return b;
}
const src = gen(seed).html; console.log('src', bad(src));
const m = minimize(src, h => !!bad(h)); console.log(m); console.log('selector:', bad(m));
