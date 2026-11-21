// Custom rule outcome x occurrence tiers: scan outcome, WCAG rollup, SARIF levels, JUnit failure, EARL failed, baseline, coercedResult.
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { coercedResult } = require('/home/user/core-r8/src/scan-result.js');
const B = require('/home/user/core-r8/src/baseline.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>';
const mk = (outcome, tiers) => ({ id: 'org-x', meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] },
  runInPage: new Function('ctx', `const t=${JSON.stringify(tiers)}; return { outcome: ${JSON.stringify(outcome)}, occurrences: t.map((tier,i)=>Object.assign({ __node: ctx.document.getElementById('ab'[i]), summary: 's'+i, hint: 'h', data:{details:{reasonCode:'R'+i}} }, tier===null?{}:{occurrenceOutcome: tier})) };`) });
const T = [null, 'pass', 'fail', 'cantTell', 'notApplicable', 'inapplicable'];
(async () => {
for (const outcome of ['pass', 'fail', 'cantTell', 'notApplicable'])
  for (const a of T) for (const b of T) {
    const tiers = [a, b];
    const warn = console.warn; console.warn = () => {};
    let r; try { r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk(outcome, tiers)] }, runOnly: ['org-x'] }); } finally { console.warn = warn; }
    const c = r.checksResults[0];
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.map(x => x.level);
    const j = (renderJunitReport(r).match(/<failure/g) || []).length;
    const e = (JSON.stringify(renderEarlReport(r)).match(/earl:failed/g) || []).length;
    const bl = B.buildBaselineEntries(r).length;
    const co = coercedResult(JSON.parse(JSON.stringify(r))).checksResults[0].outcome;
    const roll = (r.rulesResults.find(x => x.ruleId.startsWith('wcag-1.1.1')) || {}).outcome;
    const fails = c.occurrences.filter(o => (o.occurrenceOutcome || c.outcome) === 'fail').length;
    const flag = (c.outcome === 'fail') !== (j > 0) || (c.outcome === 'fail') !== (bl > 0) || co !== c.outcome || (c.outcome === 'fail' && !s.includes('error')) || (c.outcome !== 'fail' && s.includes('error')) || (roll === 'fail') !== (c.outcome === 'fail');
    if (flag) console.log('!!', outcome.padEnd(13), JSON.stringify(tiers).padEnd(28), '-> scan', c.outcome, '| occ', c.occurrences.map(o => o.occurrenceOutcome).join(','), '| coerced', co, '| rollup', roll, '| SARIF', s.join(','), '| JUnit', j, '| EARL failed', e, '| baseline', bl, c.error ? 'ERR ' + c.error.slice(0, 60) : '');
  }
console.log('done');
})();
