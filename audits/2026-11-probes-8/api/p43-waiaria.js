const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const html = process.argv[2];
console.warn = () => {}; console.info = () => {};
for (const prof of ['wai-aria-1.2', 'raweb-1.1', ['raweb-1.1', 'wai-aria-1.2']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
  for (const id of ['aria-role-name-present', 'aria-roles-valid']) {
    const c = r.checksResults.find(x => x.ruleId === id);
    console.log(JSON.stringify(prof).padEnd(30), id, c && c.outcome, String(JSON.stringify(c && c.occurrences.map(o => [o.data && o.data.details && o.data.details.reasonCode, o.occurrenceOutcome, o.verdicts]))).slice(0, 300));
  }
}
