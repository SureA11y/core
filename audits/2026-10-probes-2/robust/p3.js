const { scan, errs } = require('./h');
const fs=require('fs');
const src = fs.readFileSync('p2.js','utf8');
const cases = eval(src.match(/const cases = (\{[\s\S]*?\n\});/)[1].replace(/^/,'(') + ')');
for (const k of process.argv.slice(2)) {
  let v = cases[k], html=v, ct; if (Array.isArray(v)) [html, ct] = v;
  const r = scan(html, { contentType: ct });
  for (const c of r.r.checksResults) if (c.outcome !== 'notApplicable' && c.outcome!=='inapplicable') console.log(k, c.ruleId, c.outcome, c.occurrences.length, (c.occurrences||[]).slice(0,3).map(o=>o.selector).join(' ; '));
}
