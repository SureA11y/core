const { run } = require('./h');
const { buildBaselineEntries, matchBaseline } = require('/home/user/core/src/baseline.js');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
const origWarn = console.warn; console.warn = ()=>{};
const perturb = [
  ['prepend p', h => h.replace(/<body([^>]*)>/i, (m)=> m+'<p>unrelated paragraph</p>')],
  ['append p', h => h.replace(/<\/body>/i, '<p>unrelated tail</p></body>')],
];
const agg = {};
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  if (!/<body/i.test(html)) continue;
  let r1; try { r1 = run(html); } catch(e) { continue; }
  const e1 = buildBaselineEntries(r1);
  for (const [lab, fn] of perturb) {
    let r2; try { r2 = run(fn(html)); } catch(e) { continue; }
    const m = matchBaseline(r2, e1);
    for (const n of m.newOccurrences) {
      const k = lab+' '+n.ruleId+' '+n.reasonCode;
      if (!agg[k]) { agg[k] = {f, html: n.html.slice(0,160)}; }
    }
  }
}
console.warn = origWarn;
for (const [k,v] of Object.entries(agg)) console.log(k, '|', v.f, '|', v.html);
