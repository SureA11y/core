// A pack row `outcome: 'fail'` (as pack-wai-aria uses for an unnamed role=grid): scanned alone, the pack's
// profile fails its requirement rollup but the check stays cantTell, so SARIF warns, JUnit skips and the
// baseline records nothing; listed beside any other profile (even one that never runs the rule), the same
// finding is a SARIF error / JUnit failure / baseline entry.
const aw = require('./awpack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const B = require('/home/user/core/src/baseline.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><h1>x</h1><div role="grid"></div></main></body></html>';
(async () => {
  for (const profile of ['aw-1.0', ['aw-1.0'], ['aw-1.0', 'wcag20-a']]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { packs: [aw], profile } });
    const c = r.checksResults.find(x => x.ruleId === 'aria-role-name-present');
    const nr = r.rulesResults.find(x => x.ruleId === 'aw-1.0-NR');
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.ruleId === 'aria-role-name-present').map(x => x.level);
    const j = /name="aria-role-name-present"[^>]*>\s*<failure/.test(renderJunitReport(r));
    console.log(JSON.stringify(profile).padEnd(22), 'aw-1.0-NR', nr.outcome, '| check', c.outcome, JSON.stringify(c.verdicts || null), '| SARIF', s, '| JUnit failure', j, '| baseline', B.buildBaselineEntries(r).filter(e => e.ruleId === 'aria-role-name-present').length);
    await new Promise(s => setImmediate(s));
  }
})();
