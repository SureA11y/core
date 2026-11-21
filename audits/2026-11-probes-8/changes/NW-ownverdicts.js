const pack = require('./namespack.js')();
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><div role="grid"><div role="row"><div role="gridcell">1</div></div></div></main></body></html>';
const show = (label, eo) => {
  const r = runa11yCoreOnHtml(html, { engineOptions: Object.assign({ packs: [pack] }, eo) });
  const c = r.checksResults.find(x => x.ruleId === 'aria-role-name-present');
  const w = r.rulesResults.find(x => x.ruleId === 'wcag-4.1.2-name');
  if (!c) return console.log(label, 'no check');
  console.log(label.padEnd(30), 'check', c.outcome, 'norm', c.outcomeNormalized, 'policy', c.policyOutcome, 'occ', c.occurrences.map(o => o.occurrenceOutcome + '/' + (o.data.details.lean||'')).join(','), '| wcag rollup', w && w.outcome, '| summary', JSON.stringify(r.summary || r.counts || null).slice(0,200));
  console.log('   check.summary:', JSON.stringify(c.summary || c.message || '').slice(0,160), 'occ summary:', JSON.stringify(c.occurrences[0].summary||'').slice(0,120));
};
show('names-1.0', { profile: 'names-1.0' });
show('wcag22-aa', { profile: 'wcag22-aa' });
show('wcag22-aa + optInRules names', { profile: 'wcag22-aa', optInRules: ['names'] });
show('no profile, runOnly names', { runOnly: { tags: ['names'] } });
show('[names-1.0, wcag22-aa]', { profile: ['names-1.0', 'wcag22-aa'] });
for (const [label, eo] of [['optIn', { profile: 'wcag22-aa', optInRules: ['names'] }], ['runOnly names', { runOnly: { tags: ['names'] } }], ['optIn all', { optInRules: 'all' }]]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: Object.assign({ packs: [pack] }, eo) });
  const n = r.rulesResults.filter(x => /^names-/.test(x.ruleId)).map(x => x.ruleId + '=' + x.outcome);
  const c = r.checksResults.find(x => x.ruleId === 'aria-role-name-present');
  console.log(label, n, 'check', c && c.outcome, 'engine.profile', JSON.stringify(r.engine.profile));
}
