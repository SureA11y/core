const fs = require('fs');
const H = require('./harness');
const corpus = require(process.env.CORPUS||'./corpus');
const IGN = /^(contrast-|target-size|text-spacing|avoid-inline|css-|link-in-text-block|manual-review)/;
function match(exp, got) {
  if (exp === '!na') return got !== 'notApplicable'; if (exp[0] === '!') return got !== exp.slice(1);
  if (exp === '!na') return got !== 'notApplicable';
  return exp === got;
}
(async () => {
  const filter = process.argv[2];
  const all = [];
  for (const c of corpus) {
    if (filter && !c.name.includes(filter)) continue;
    let j, b;
    try { j = H.runJsdom(c); } catch (e) { j = { __throw: String(e && e.stack || e) }; }
    try { b = await H.runChromium(c); } catch (e) { b = { __throw: String(e && e.stack || e) }; }
    all.push({ name: c.name, expect: c.expect, j, b });
  }
  await H.close();
  fs.writeFileSync('/tmp/scratchpad/rules-a/'+(process.env.OUT||'results')+'.json', JSON.stringify(all, null, 1));
  const lines = [];
  for (const { name, expect, j, b } of all) {
    if (j.__throw) lines.push(`THROW jsdom [${name}] ${j.__throw.slice(0, 300)}`);
    if (b.__throw) lines.push(`THROW chromium [${name}] ${b.__throw.slice(0, 300)}`);
    if (j.__throw || b.__throw) continue;
    for (const [rid, e] of Object.entries(expect)) {
      for (const [env, r] of [['J', j], ['C', b]]) {
        const g = r[rid];
        if (!g) { lines.push(`NORULE ${rid}`); continue; }
        if (!match(e, g.outcome)) lines.push(`MISMATCH ${env} [${name}] ${rid}: expected ${e} got ${g.outcome} | ${g.occ.join(' || ')}`);
      }
    }
    for (const rid of Object.keys(j)) {
      if (rid.startsWith('__') || IGN.test(rid)) continue;
      if (j[rid].error || (b[rid] && b[rid].error)) lines.push(`ERROR [${name}] ${rid} ${j[rid].error} ${b[rid] && b[rid].error}`);
      if (b[rid] && j[rid].outcome !== b[rid].outcome) lines.push(`DIVERGE [${name}] ${rid}: jsdom=${j[rid].outcome} chromium=${b[rid].outcome} | J:${j[rid].occ.join(' || ')} | C:${b[rid].occ.join(' || ')}`);
      if (!(rid in expect) && (j[rid].outcome === 'fail' || j[rid].outcome === 'cantTell')) lines.push(`OTHER [${name}] ${rid}=${j[rid].outcome} | ${j[rid].occ.join(' || ')}`);
    }
  }
  fs.writeFileSync('/tmp/scratchpad/rules-a/'+(process.env.OUT||'report')+'.txt', lines.join('\n'));
  console.log(lines.filter((l) => !l.startsWith('OTHER')).join('\n'));
})();
