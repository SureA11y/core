// A rule returns outcome 'fail' whose occurrences are all pass-tier (or pass + cantTell).
// Engine keeps 'fail' (rollup fails, EARL failed) while SARIF/JUnit/baseline see no failure.
// The exclusion path settles the very same occurrences to pass / cantTell.
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const B = require('/home/user/core/src/baseline.js');
const mk = (tiers, extra) => ({ id: 'org-x', meta: { title: 'T', description: 'd', tags: ['wcag111','wcag2a'], wcagSc: ['1.1.1'] },
  runInPage: new Function('ctx', `const t=${JSON.stringify(tiers)}; return { outcome: 'fail', occurrences: [${extra?"{__node: ctx.document.getElementById('z'), summary:'x', hint:'h', occurrenceOutcome:'fail', data:{details:{reasonCode:'RZ'}}},":""} ...t.map((tier,i)=>({ __node: ctx.document.getElementById('ab'[i]), summary: 's'+i, hint: 'h', occurrenceOutcome: tier, data:{details:{reasonCode:'R'+i}} }))] };`) });
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p><div class="ex"><p id="z">z</p></div></main></body></html>';
(async () => {
  for (const [label, tiers, extra, ex] of [['plain [pass,pass]',['pass','pass'],false,null],['excluded fail + [pass,pass]',['pass','pass'],true,['.ex']],['plain [pass,cantTell]',['pass','cantTell'],false,null],['excluded fail + [pass,cantTell]',['pass','cantTell'],true,['.ex']]]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk(tiers, extra)], ...(ex?{excludeSelectors: ex}:{}) }, runOnly: ['org-x'] });
    const c = r.checksResults[0];
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.map(x=>x.level);
    const j = (renderJunitReport(r).match(/<failure/g)||[]).length;
    const e = JSON.stringify(renderEarlReport(r)); const earlFailed = (e.match(/earl:failed/g)||[]).length;
    console.log(label.padEnd(32), 'outcome', c.outcome, JSON.stringify(c.excludedOccurrences||null), '| rollup', r.rulesResults[0].outcome, '| SARIF', JSON.stringify(s), '| JUnit failures', j, '| EARL failed', earlFailed, '| baseline', B.buildBaselineEntries(r).length);
    await new Promise(r=>setImmediate(r));
  }
})();
