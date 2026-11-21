// A finding pack-raweb's standard does not count (verdict notApplicable): the check fails under raweb-1.1 alone,
// passes in a scan of raweb-1.1 with any other profile, and the reporters disagree with that pass.
const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const B = require('/home/user/core-r8/src/baseline.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><div role="main">b</div></body></html>';
console.warn = () => {}; console.info = () => {};
const ID = 'rgaa-main-element-structure';
for (const prof of ['raweb-1.1', ['raweb-1.1', 'wai-aria-1.2'], ['raweb-1.1', 'wcag22-aa'], 'rgaa-4.1.2', ['rgaa-4.1.2', 'wai-aria-1.2']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
  const c = r.checksResults.find(x => x.ruleId === ID);
  const o = c.occurrences[0];
  const sarif = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.ruleId === ID).map(x => x.level);
  const junitFail = new RegExp('name="' + ID + '"[^>]*>\\s*<failure').test(renderJunitReport(r));
  const earl = renderEarlReport(r)['@graph'][0].assertions.filter(a => a.test.title === ID || JSON.stringify(a).includes(ID)).map(a => a.result.outcome);
  const base = B.buildBaselineEntries(r).filter(e => e.ruleId === ID).length;
  const occOut = o ? core.occurrenceOutcome(c, o) : null;
  console.log(JSON.stringify(prof).padEnd(30), `check=${c.outcome} occ=${c.occurrences.length} occurrenceOutcome()=${occOut} verdicts=${JSON.stringify(o && o.verdicts)} | sarif=${JSON.stringify(sarif)} junitFail=${junitFail} earl=${JSON.stringify(earl)} baseline=${base}`);
}
{
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: ['raweb-1.1', 'wai-aria-1.2'] } });
  const as = renderEarlReport(r)['@graph'][0].assertions.filter(a => JSON.stringify(a).includes(ID));
  console.log('EARL in multi:', JSON.stringify(as).slice(0, 700));
}
