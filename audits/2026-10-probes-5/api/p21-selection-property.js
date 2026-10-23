// Random property test: getChecksForRunOnly / getRulesForRunOnly vs what a scan runs and reports,
// over random runOnly forms and engine options (wcagLevel, wcagVersion, profile, optInRules).
'use strict';
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const N = Number(process.argv[2] || 150);
let seed = Number(process.argv[3] || 7);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const some = (a, k) => { const out = new Set(); const n = 1 + Math.floor(rnd() * k); for (let i = 0; i < n; i++) out.add(pick(a)); return [...out]; };
const checks = core.getChecksCatalog();
const ruleIds = checks.map((c) => c.ruleId);
const rollupIds = core.getRulesCatalog().map((r) => r.id);
const tags = [...new Set(checks.flatMap((c) => c.tags))];
const html = '<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>x</h1><img src=x.png><a href="/">l</a><button></button><input></main></body></html>';
function randomSelection() {
  const k = Math.floor(rnd() * 12);
  switch (k) {
    case 0: return null;
    case 1: return some(ruleIds.concat(rollupIds), 4);
    case 2: return some(tags, 3);
    case 3: return { wcag: { version: pick(['2.0', '2.1', '2.2']), level: pick(['A', 'AA', 'AAA']) } };
    case 4: return { wcag: { version: pick(['2.0', '2.1', '2.2']), level: pick(['A', 'AA', 'AAA']) }, bestPractices: rnd() < 0.5, excludeRuleIds: some(ruleIds, 3) };
    case 5: return { includeRuleIds: some(ruleIds.concat(rollupIds), 4), tags: some(tags, 2), includeMode: pick(['and', 'or']) };
    case 6: return { bestPractices: true, excludeTags: some(tags, 2) };
    case 7: return { type: 'tag', values: some(tags, 3).join(',') };
    case 8: return { tags: some(tags, 3), excludeRuleIds: some(ruleIds, 5) };
    case 9: return { includeRuleIds: some(rollupIds, 2), excludeTags: some(tags, 1) };
    case 10: return pick(ruleIds);
    default: return { excludeRuleIds: some(ruleIds.concat(rollupIds), 6) };
  }
}
function randomOptions() {
  const eo = {};
  if (rnd() < 0.3) eo.wcagLevel = pick(['A', 'AA', 'AAA']);
  if (rnd() < 0.3) eo.wcagVersion = pick(['2.0', '2.1', '2.2']);
  if (rnd() < 0.25) eo.profile = pick(['wcag22-aa', 'section508', 'en301549-v3.2.1', 'en301549-v4.1.1']);
  if (rnd() < 0.15) eo.rules = { exclude: some(ruleIds, 3) };
  return eo;
}
const ow = console.warn, oi = console.info; console.warn = () => {}; console.info = () => {};
let diffs = 0, ran = 0, threw = 0;
for (let i = 0; i < N; i++) {
  const sel = randomSelection(), eo = randomOptions();
  let predChecks, predRules, scan, eP = null, eS = null;
  try { predChecks = core.getChecksForRunOnly(sel, eo).map((c) => c.ruleId).sort(); predRules = core.getRulesForRunOnly(sel, eo).map((r) => r.id).sort(); } catch (e) { eP = e.code || e.message; }
  try { scan = runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: sel }); } catch (e) { eS = e.code || e.message.slice(0, 80); }
  if (eP || eS) { if (String(eP) !== String(eS) && !(eP && eS)) { diffs++; ow('THROW MISMATCH', JSON.stringify(sel), JSON.stringify(eo), 'catalog:', eP, 'scan:', eS); } else threw++; continue; }
  ran++;
  const sc = scan.checksResults.map((c) => c.ruleId).sort(), sr = (scan.rulesResults || []).map((r) => r.ruleId).sort();
  const d1 = predChecks.filter((x) => !sc.includes(x)), d2 = sc.filter((x) => !predChecks.includes(x));
  const d3 = predRules.filter((x) => !sr.includes(x)), d4 = sr.filter((x) => !predRules.includes(x));
  if (d1.length || d2.length || d3.length || d4.length) { diffs++; ow('DIFF', JSON.stringify(sel).slice(0, 200), JSON.stringify(eo), { catalogOnlyChecks: d1, scanOnlyChecks: d2, catalogOnlyRollups: d3, scanOnlyRollups: d4 }); }
}
console.warn = ow; console.info = oi;
console.log('cases', N, 'compared', ran, 'both threw', threw, 'differences', diffs);
