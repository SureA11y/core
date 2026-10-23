// WCAG rollups vs rules: best practices in WCAG rollups, rules missing from their criteria's rollups,
// tags vs wcagSc levels, and the "rules find every case" list.
'use strict';
const core = require('/home/user/core/src/index.js');
const checks = core.getChecksCatalog();
const rollups = core.getRulesCatalog();
const byId = new Map(checks.map((c) => [c.ruleId, c]));
const wvm = require('/home/user/core/src/coverage/wcag-version-map.js');
console.log('wcag-version-map exports', Object.keys(wvm));
console.log('rollup keys', Object.keys(rollups[0]));
let n = 0;
for (const r of rollups) {
  const sc = r.meta && r.meta.wcagSc && r.meta.wcagSc[0];
  if (!sc || r.meta.standard) continue;
  n++;
  for (const id of r.checksIds || r.checks || []) {
    const c = byId.get(id);
    if (!c) { console.log('rollup', r.ruleId, 'names unknown rule', id); continue; }
    if (c.tags.includes('best-practice')) console.log('BEST-PRACTICE in WCAG rollup', r.id, id);
    if (!(c.wcagSc || []).includes(sc)) console.log('rule in rollup but not mapped to its SC', r.id, id, c.wcagSc);
  }
}
console.log('WCAG rollups', n);
const rollupOf = new Map();
for (const r of rollups) for (const sc of (r.meta.wcagSc || [])) if (!r.meta.standard) (rollupOf.get(sc) || rollupOf.set(sc, []).get(sc)).push(r);
for (const c of checks) {
  for (const sc of c.wcagSc || []) {
    const rs = rollupOf.get(sc) || [];
    if (!rs.length) console.log('rule maps SC with no rollup', c.ruleId, sc);
    else if (!rs.some((r) => (r.checksIds || []).includes(c.ruleId))) console.log('rule maps SC but not in its rollup', c.ruleId, sc, rs.map((r) => r.id));
  }
  if (c.tags.includes('best-practice') && (c.wcagSc || []).length) console.log('best-practice rule with wcagSc', c.ruleId, c.wcagSc);
  if (!c.tags.includes('best-practice') && !(c.wcagSc || []).length) console.log('non-best-practice rule with no wcagSc', c.ruleId, c.tags);
}
