const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const html = process.argv[2];
console.warn = () => {}; console.info = () => {};
for (const prof of ['raweb-1.1', ['raweb-1.1', 'wai-aria-1.2']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
  const c = r.checksResults.find(x => x.ruleId === 'rgaa-main-element-structure');
  console.log(JSON.stringify(prof), c.outcome, JSON.stringify(c.occurrences.map(o => [o.data && o.data.details && o.data.details.reasonCode, o.occurrenceOutcome, o.selector, o.verdicts])).slice(0, 700));
  const rr = r.rulesResults.filter(x => (x.checksIds || (x.data && x.data.details && x.data.details.checksIds) || []).includes('rgaa-main-element-structure') || JSON.stringify(x).includes('rgaa-main-element-structure'));
  console.log('  rollups naming it:', rr.map(x => x.ruleId + ':' + x.outcome).join(', '));
  if (r.profiles) for (const [p, v] of Object.entries(r.profiles)) console.log('  profiles.' + p, Object.entries(v.rulesResults).filter(([k]) => rr.some(x => x.ruleId === k)).map(([k, o]) => k + ':' + o).join(', '));
}
