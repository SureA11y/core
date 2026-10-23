const { scanHtml, close } = require('./pw');
const fs = require('fs');
const src = fs.readFileSync('perf.js', 'utf8');
const gens = eval('(' + src.match(/const gens = (\{[\s\S]*?\n\});/)[1] + ')');
(async () => {
  const which = process.argv[2]; const Ns = process.argv[3].split(',').map(Number);
  for (const N of Ns) {
    const o = await scanHtml(gens[which](N), { runOnly: process.env.RULE ? [process.env.RULE] : null, engineOptions: { profileRules: true, perfStats: true } });
    const t = o.r && o.r.perfStats && o.r.perfStats.ruleTimings || {};
    const errs = o.r ? o.r.checksResults.filter(c => c.error).map(c => c.ruleId + ':' + c.error) : [];
    console.log(which, N, o.err || '', Math.round(o.ms) + 'ms', errs.slice(0,3), Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + '=' + Math.round(v)).join(' '));
  }
  await close();
})();
