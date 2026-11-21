// A pack's profile alone turns a check to fail (withOwnVerdicts) even when policy.allowedOutcomes leaves fail out.
const pack = require('./namespack.js')();
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><div role="grid"><div role="row"><div role="gridcell">1</div></div></div></main></body></html>';
const policy = { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] };
for (const profile of ['names-1.0', ['names-1.0', 'wcag22-aa'], 'wcag22-aa']) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile, policy } });
  const c = r.checksResults.find(x => x.ruleId === 'aria-role-name-present');
  const fails = r.checksResults.filter(x => x.outcome === 'fail').map(x => x.ruleId);
  const ro = r.rulesResults.filter(x => x.outcome === 'fail').map(x => x.ruleId);
  const sarif = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.ruleId === 'aria-role-name-present').map(x => x.level);
  console.log(JSON.stringify(profile).padEnd(26), 'check', c.outcome, 'policyOutcome', c.policyOutcome, '| failing checks', fails, '| failing rollups', ro, '| SARIF', sarif);
}
