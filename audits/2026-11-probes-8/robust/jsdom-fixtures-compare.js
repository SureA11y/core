'use strict';
// jsdom: full-scan time per fixture, 1.17.0 bundle vs main bundle (both run inside jsdom), interleaved, median of 3.
// Also per-rule totals over all fixtures, to spot a rule slower than 1.17.0.
const fs = require('fs');
const J = require('./jsdom-bundle.js');
const L = require('./lib.js');
const FIX = '/home/user/core-r8/tests/fixtures';
const files = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const REPS = 3;
const tot = { base: 0, head: 0 }, rules = { base: {}, head: {} };
let changed = 0;
(async () => {
for (const f of files) {
  const html = fs.readFileSync(`${FIX}/${f}`, 'utf8');
  const t = { base: [], head: [] }, o = {};
  for (let k = 0; k < REPS; k++) for (const v of k % 2 ? ['head', 'base'] : ['base', 'head']) {
    let r, ms;
    let dom;
    try { ({ r, ms, dom } = J.scanWith(v, html)); } catch (e) { console.log(f, v, 'THROW', e.message.slice(0, 100)); continue; }
    r = JSON.parse(JSON.stringify({ perfStats: r.perfStats, checksResults: r.checksResults.map((c) => ({ ruleId: c.ruleId, outcome: c.outcome, occurrences: c.occurrences.map(() => 0) })) }));
    try { dom.window.close(); } catch {}
    await new Promise((res) => setTimeout(res, 5));
    t[v].push({ ms, rt: r.perfStats.ruleTimings });
    o[v] = r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length);
  }
  for (const v of ['base', 'head']) {
    if (!t[v].length) continue;
    tot[v] += L.median(t[v].map((x) => x.ms));
    for (const id of Object.keys(t[v][0].rt)) rules[v][id] = (rules[v][id] || 0) + L.median(t[v].map((x) => x.rt[id] || 0));
  }
  const diffs = (o.head || []).filter((x) => !(o.base || []).includes(x));
  if (diffs.length) changed++;
}
const slower = Object.keys(rules.head).filter((id) => rules.base[id] != null && rules.head[id] > 1.3 * rules.base[id] && rules.head[id] - rules.base[id] > 20).map((id) => `${id} ${rules.base[id].toFixed(0)}->${rules.head[id].toFixed(0)}`);
console.log(JSON.stringify({ fixtures: files.length, totalBaseMs: Math.round(tot.base), totalHeadMs: Math.round(tot.head), ratio: +(tot.head / tot.base).toFixed(3), fixturesWithOutcomeChanges: changed, rulesSlowerThanBase: slower }));
})();
