const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { buildBaselineEntries } = require('/home/user/core/src/baseline.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const r = run('<!doctype html><html lang="en"><head><title>Custom rule page</title></head><body><main><h1>Hi</h1></main></body></html>', {
  url: 'https://example.test/',
  runOnly: { includeRuleIds: ['org-page-fail'] },
  engineOptions: { customRules: [{ id: 'org-page-fail', meta: { title: 'Org page rule', defaultSeverity: 'serious', wcagSc: ['2.4.2'] }, runInPage(ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', severity: 'serious', occurrences: [] }; } }] }
});
const c = r.checksResults.find(c => c.ruleId === 'org-page-fail');
console.log(JSON.stringify({ outcome: c.outcome, occ: c.occurrences, meta: c.meta && c.meta.normativeMappings, type: c.type }));
console.log('sarif results', JSON.parse(renderSarifReport(r)).runs[0].results.length);
console.log(renderJunitReport(r));
console.log('baseline entries', buildBaselineEntries(r).length);
console.log(JSON.stringify(renderEarlReport(r)['@graph'][0].assertions.map(a=>[a.test.title,a.result.outcome])));
require("fs").writeFileSync(__dirname + "/custom.html", renderHtmlReport(r));
