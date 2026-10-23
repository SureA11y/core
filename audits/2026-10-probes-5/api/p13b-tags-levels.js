// Each rule's version/level tags vs the levels and versions of the criteria it maps (from the rollups' meta.level).
'use strict';
const core = require('/home/user/core/src/index.js');
const wvm = require('/home/user/core/src/coverage/wcag-version-map.js');
const checks = core.getChecksCatalog();
const level = {};
for (const r of core.getRulesCatalog()) for (const sc of r.meta.wcagSc || []) if (!r.meta.standard) level[sc] = r.meta.level;
const pre = (sc) => { const v = wvm.introducedInVersion(sc); return v === '2.1' ? 'wcag21' : v === '2.2' ? 'wcag22' : 'wcag2'; };
let bad = 0;
for (const c of checks) {
  const want = new Set((c.wcagSc || []).map((sc) => pre(sc) + String(level[sc] || '?').toLowerCase()));
  const have = new Set(c.tags.filter((t) => /^wcag2(1|2)?a{1,3}$/.test(t)));
  const scTags = new Set(c.tags.filter((t) => /^wcag\d{3,4}$/.test(t)));
  const wantSc = new Set((c.wcagSc || []).map((sc) => 'wcag' + sc.replace(/\./g, '')));
  const eq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
  if (!eq(want, have) || !eq(scTags, wantSc)) { bad++; console.log(c.ruleId, 'sc', c.wcagSc, 'tags', [...have], 'want', [...want], 'scTags', [...scTags]); }
}
console.log('rules', checks.length, 'mismatched', bad);
