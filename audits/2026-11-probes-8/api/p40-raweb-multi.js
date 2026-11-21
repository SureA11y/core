// pack-raweb's profile listed with wai-aria-1.2: a failure under raweb-1.1 alone reads pass.
const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const html = process.argv[2] || '<!doctype html><html lang="en"><head><title>t</title></head><body><div>No main element here</div></body></html>';
(async () => {
  console.warn = () => {}; console.info = () => {};
  for (const prof of ['raweb-1.1', 'rgaa-4.1.2', ['raweb-1.1', 'wai-aria-1.2'], ['wai-aria-1.2', 'raweb-1.1'], ['raweb-1.1', 'wcag22-aa'], ['rgaa-4.1.2', 'wai-aria-1.2']]) {
    const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
    const c = r.checksResults.find(x => x.ruleId === 'rgaa-main-element-structure');
    const sErr = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.ruleId === 'rgaa-main-element-structure').map(x => x.level);
    const jf = /name="rgaa-main-element-structure"[^>]*>\s*<failure/.test(renderJunitReport(r));
    console.log(JSON.stringify(prof).padEnd(32), 'outcome', c && c.outcome, 'occ', c && c.occurrences.length, 'verdicts', JSON.stringify(c && c.occurrences.map(o => o.verdicts)), 'sarif', JSON.stringify(sErr), 'junitFail', jf, 'profiles', JSON.stringify(r.engine.profiles));
  }
})();
