const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const html = '<!doctype html><html lang="en"><head><title>T</title></head><body><div id="bar"><p id="pb">x</p></div><main><p id="pq">q</p><p id="pm">y</p></main></body></html>';
const src = "function(ctx){var d=ctx.document,h=ctx.helpers;return {outcome:'fail',occurrences:[h.reportOccurrence(d.getElementById('pb'),{summary:'bad',occurrenceOutcome:'fail'}),h.reportOccurrence(d.getElementById('pq'),{summary:'unsure',occurrenceOutcome:'cantTell'}),h.reportOccurrence(d.getElementById('pm'),{summary:'fine',occurrenceOutcome:'pass'})]};}";
const rule = { id: 'probe-rule', meta: { title: 'P', description: 'P', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: src };
for (const eo of [{}, { excludeSelectors: ['#bar'] }]) {
  const res = runa11yCoreOnHtml(html, { runOnly: ['probe-rule'], engineOptions: { customRules: [rule], ...eo } });
  const r = res.checksResults.find(c => c.ruleId === 'probe-rule');
  const roll = res.rulesResults.find(x => /1\.1\.1/.test(x.ruleId));
  const sarif = JSON.parse(renderSarifReport(res)).runs[0].results.map(x => x.level + '@' + (x.locations && x.locations[0] && JSON.stringify(x.locations[0]).match(/#p\w/)));
  console.log(JSON.stringify(eo), '->', r.outcome, JSON.stringify(r.occurrences.map(o => o.selector + ':' + o.occurrenceOutcome)), 'rollup', roll.outcome, 'sarif', sarif.join(','));
}
