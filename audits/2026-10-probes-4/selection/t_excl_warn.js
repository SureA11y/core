const L = require('./lib');
const C = L.custom;
const cr = [C('org-z', { wcagSc: ['1.1.1'], tags: ['org'] }), C('org-w', { wcagSc: ['4.1.2'], tags: ['org'] }, 'pass')];
for (const [ro, eo] of [
  [{ tags: ['org'], excludeRuleIds: ['org-z'] }, { customRules: cr }],
  [{ includeRuleIds: ['org-z', 'org-w'], excludeRuleIds: ['org-z'] }, { customRules: cr }],
  [null, { customRules: cr, rules: { exclude: ['org-z'] } }],
  [{ excludeRuleIds: ['org-z'] }, { customRules: cr }],
]) {
  const s = L.scan(ro, eo);
  console.log(JSON.stringify(ro), JSON.stringify(eo.rules || ''), s.warned.filter((w) => /customRules/.test(w)));
}
