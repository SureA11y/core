const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const B = require('/home/user/core/src/baseline.js');
const rule = {
  id: 'org-tiers',
  meta: { title: 'Org tiers', description: 'd', tags: ['wcag111','wcag2a'], wcagSc: ['1.1.1'] },
  runInPage(ctx) {
    const d = ctx.document;
    const a = d.querySelector('#a'), b = d.querySelector('#b');
    return { outcome: 'fail', occurrences: [
      { __node: a, summary: 'A fails', hint: 'h', occurrenceOutcome: 'fail', data: { details: { reasonCode: 'X_FAIL' } } },
      { __node: b, summary: 'B passes', hint: 'h', occurrenceOutcome: 'pass', data: { details: { reasonCode: 'X_PASS' } } },
    ] };
  }
};
(async () => {
  const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>';
  const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule] }, runOnly: ['org-tiers'] });
  const c = r.checksResults.find(x => x.ruleId === 'org-tiers');
  console.log('outcome', c.outcome, c.error, c.occurrences.map(o => [o.selector, o.occurrenceOutcome]));
  const sarif = renderSarifReport(r);
  const s = JSON.parse(typeof sarif === 'string' ? sarif : JSON.stringify(sarif));
  console.log('sarif results', s.runs[0].results.map(x => [x.ruleId, x.level, x.kind, JSON.stringify(x.locations && x.locations[0] && x.locations[0].logicalLocations||x.locations)]).map(String));
  const j = renderJunitReport(r); console.log('junit', (j.match(/<testsuite[^>]*>/g)||[]).join('\n'), (j.match(/<failure/g)||[]).length);
  const e = renderEarlReport(r); const es = typeof e==='string'?e:JSON.stringify(e); console.log('earl mentions #b:', /#b|B passes/.test(es), 'outcomes', (es.match(/earl:(passed|failed|cantTell|inapplicable)/g)||[]).join(','));
  const h = renderHtmlReport(r); console.log('html has B passes', h.includes('B passes'));
  const entries = B.buildBaselineEntries(r); console.log('baseline', JSON.stringify(entries).slice(0,400));
})();
