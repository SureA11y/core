// A capped result hides new lean-fail findings from matchBaseline's leanFail and JUnit/SARIF leanFailAs gates
const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const { matchBaseline, buildBaselineEntries } = require('/home/user/core-r10/src/baseline.js');
const { renderJunitReport } = require('/home/user/core-r10/src/junit.js');
const { renderSarifReport } = require('/home/user/core-r10/src/sarif.js');
const { leaningFailures } = require('/home/user/core-r10/src/index.js');
const W = console.warn; console.warn = () => {};
const T='<table><tr><td>a</td><td>1</td></tr><tr><td>b</td><td>2</td></tr></table>'; const pageOf = n => `<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1>${T.repeat(1+n)}</main></body></html>`;
const before = runa11yCoreOnHtml(pageOf(0), { entryPointParity:false });
const after = runa11yCoreOnHtml(pageOf(6), { entryPointParity:false });
const afterCap = runa11yCoreOnHtml(pageOf(6), { entryPointParity:false, engineOptions:{ output:{ maxOccurrencesPerRule: 1 } } });
console.warn = W;
const entries = buildBaselineEntries(before, { leanFail: true });
console.log('leaning before/after/afterCap', leaningFailures(before).length, leaningFailures(after).length, leaningFailures(afterCap).length);
const p = afterCap.checksResults.find(c=>c.ruleId==='td-has-header'); console.log('td-has-header capped', p.outcome, p.occurrences.length, p.occurrencesOmitted, JSON.stringify(p.occurrencesOmittedByOutcome));
const m1 = matchBaseline(after, entries, {leanFail:true}), m2 = matchBaseline(afterCap, entries, {leanFail:true});
console.log('uncapped leanFail', JSON.stringify({t:m1.leanFail.total,new:m1.leanFail.newCount}), 'incomplete', JSON.stringify(m1.incomplete));
console.log('capped   leanFail', JSON.stringify({t:m2.leanFail.total,new:m2.leanFail.newCount}), 'incomplete', JSON.stringify(m2.incomplete));
for (const [n, r] of [['uncapped', after], ['capped', afterCap]]) {
  const j = renderJunitReport(r, { baselineEntries: entries, leanFailAs: 'failure' });
  const s = JSON.parse(renderSarifReport(r, { baselineEntries: entries, leanFailAs: 'error' }));
  const errs = s.runs[0].results.filter(x=>x.level==='error' && /td-has-header/.test(x.ruleId)).length;
  console.log(n, 'JUnit', (j.match(/<testsuites[^>]*>/)||[])[0], 'SARIF td-has-header errors', errs);
}
