const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml');
module.exports = function probe(label, html, rules, opts={}) {
  let r;
  try { r = run(html.startsWith('<!doctype')?html:'<!doctype html><html lang="en"><head><title>t</title></head><body>'+html+'</body></html>', Object.assign({runOnly: rules}, opts)); }
  catch(e){ console.log('THROW', label, e.message); return; }
  const out = [];
  for (const res of r.checksResults) {
    const occ = (res.occurrences||[]).map(o => `${o.outcome||''} ${(o.html||'').slice(0,70)} | ${o.data?.details?.reasonCode||''} | ${(o.summary||'').slice(0,120)}`);
    out.push(`  ${res.ruleId} => ${res.outcome}${res.error?' ERR '+res.error:''}\n    ${occ.join('\n    ')}`);
  }
  console.log('## '+label+'\n'+out.join('\n'));
  return r;
};
