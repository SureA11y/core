const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const B = require('/home/user/core/src/baseline.js');
const rule = { id: 'org-tiers', meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] },
  runInPage(ctx) { return { outcome: 'fail', occurrences: [
    { __node: ctx.document.getElementById('a'), summary: 'A', hint: 'h', occurrenceOutcome: 'fail', data: { details: { reasonCode: 'X_FAIL' } } },
    { __node: ctx.document.getElementById('b'), summary: 'B', hint: 'h', occurrenceOutcome: 'pass', data: { details: { reasonCode: 'X_PASS' } } },
    { __node: ctx.document.getElementById('c'), summary: 'C', hint: 'h', occurrenceOutcome: 'cantTell', data: { details: { reasonCode: 'X_Q' } } } ] }; } };
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p><p id="c">c</p></main></body></html>';
(async () => {
  for (const profile of ['wcag22-aa', ['wcag22-aa', 'wcag21-a']]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule], profile } });
    const c = r.checksResults.find(x => x.ruleId === 'org-tiers');
    console.log(JSON.stringify(profile), c.outcome, JSON.stringify(c.verdicts), c.occurrences.map(o => o.selector + ':' + o.occurrenceOutcome + ':' + JSON.stringify(o.verdicts)).join(' '));
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.ruleId === 'org-tiers').map(x => x.level + ' ' + x.locations[0].logicalLocations[0].fullyQualifiedName);
    console.log('   sarif', s, 'baseline', B.buildBaselineEntries(r).filter(e => e.ruleId === 'org-tiers').map(e => e.selector));
    await new Promise(s => setImmediate(s));
  }
})();
