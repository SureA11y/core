const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const r = run('<!doctype html><html lang="en"><head><title>Custom rule page</title></head><body><main><h1>Hi</h1></main></body></html>', {
  url: 'https://example.test/',
  runOnly: { includeRuleIds: ['org-throws'] },
  engineOptions: { customRules: [{ id: 'org-throws', meta: { title: 'Org rule', defaultSeverity: 'serious' }, runInPage() { throw new Error('boom'); } }] }
});
const c = r.checksResults.find(c => c.ruleId === 'org-throws');
console.log(JSON.stringify({ outcome: c.outcome, occ: c.occurrences, error: c.error }));
console.log(JSON.stringify(JSON.parse(renderSarifReport(r)).runs[0]).includes('boom'), renderJunitReport(r).includes('boom'), renderHtmlReport(r).includes('boom'));
console.log(renderJunitReport(r).split('\n').filter(l => /testcase|skipped|testsuites /.test(l)).join('\n'));
