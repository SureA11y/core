// pack-wai-aria's profile with pack-raweb's: a check reads 'pass' while its finding keeps occurrenceOutcome 'cantTell'.
const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><div role="foo">x</div></main></body></html>';
console.warn = () => {}; console.info = () => {};
for (const prof of ['wai-aria-1.2', ['wai-aria-1.2', 'raweb-1.1'], ['wai-aria-1.2', 'wcag22-aa']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
  const c = r.checksResults.find(x => x.ruleId === 'aria-roles-valid');
  if (!c) { console.log(JSON.stringify(prof), 'no check'); continue; }
  const o = c.occurrences[0];
  const sarif = JSON.parse(renderSarifReport(r, { allowProfilesNotRun: true })).runs[0].results.filter(x => x.ruleId === c.ruleId).map(x => x.level);
  const junit = renderJunitReport(r, { cantTellAs: 'failure' });
  const jf = /name="aria-roles-valid"[^>]*>\s*<failure/.test(junit);
  console.log(JSON.stringify(prof).padEnd(28), 'check', c.outcome, '| occ tier', o && o.occurrenceOutcome, 'reasonCode', o && o.data && o.data.details && o.data.details.reasonCode, 'verdicts', JSON.stringify(o && o.verdicts), '| occurrenceOutcome()', o && core.occurrenceOutcome(c, o), '| sarif', JSON.stringify(sarif), '| junit(cantTellAs failure) fails', jf);
}
