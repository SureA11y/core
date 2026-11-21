const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const B = require('/home/user/core-r8/src/baseline.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const fs = require('fs');
const html = fs.readFileSync('/home/user/core-r8/tests/fixtures/accesskeys-all-scenarios.html', 'utf8');
(async () => {
  console.warn = () => {}; console.info = () => {};
  const r = await runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: ['wcag22-aa', 'rgaa-4.1.2', 'wai-aria-1.2'] } });
  const c = r.checksResults.find(c => c.outcome === 'fail');
  console.log(c.ruleId, JSON.stringify(c.occurrences.map(o => ({ oo: o.occurrenceOutcome, v: o.verdicts, rc: o.data && o.data.details && o.data.details.reasonCode, sel: o.selector }))));
  const bl = B.buildBaselineEntries(r);
  console.log('baseline', JSON.stringify(bl).slice(0, 400));
  const m = B.matchBaseline(r, []);
  console.log('match []', JSON.stringify(m).slice(0, 300));
  const s = JSON.parse(renderSarifReport(r));
  console.log('sarif errors', JSON.stringify(s.runs[0].results.filter(x => x.level === 'error').map(x => x.ruleId)));
  // single-profile
  const r2 = await runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: 'rgaa-4.1.2' } });
  const c2 = r2.checksResults.find(c => c.ruleId === c.ruleId && c.ruleId === 'rgaa-main-element-structure');
  console.log('rgaa alone', c2 && c2.outcome, 'baseline', JSON.stringify(B.buildBaselineEntries(r2)).slice(0, 300), 'match', JSON.stringify(B.matchBaseline(r2, [])).slice(0,200));
})();
