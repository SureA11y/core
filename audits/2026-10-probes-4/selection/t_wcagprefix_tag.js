const L = require('./lib'); const { core } = L;
for (const tag of ['org', 'wcagteam', 'wcag-org']) {
  const eo = { customRules: [L.custom('org-chart', { wcagSc: ['1.1.1'], tags: [tag] }, 'fail')] };
  const s = L.scan({ tags: [tag] }, eo);
  console.log(tag, s.error ? s.error.message : s.value.checksResults.map((c) => c.ruleId + ':' + c.outcome + ' rollupIds=' + c.rollupIds).join(',') + ' | rollups=' + s.value.rulesResults.map((r) => r.ruleId + ':' + r.outcome).join(','));
}
