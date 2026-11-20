const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const rule = { id: 'org-tiers', meta: { title: 'Org tiers', description: 'd', tags: ['wcag111','wcag2a'], wcagSc: ['1.1.1'] },
  runInPage(ctx) { return { outcome: 'fail', occurrences: [
      { __node: ctx.document.getElementById('a'), summary: 'AFAILS', hint: 'h', occurrenceOutcome: 'fail', data: { details: { reasonCode: 'X_FAIL' } } },
      { __node: ctx.document.getElementById('b'), summary: 'BPASSES', hint: 'h', occurrenceOutcome: 'pass', data: { details: { reasonCode: 'X_PASS' } } } ] }; } };
(async () => {
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>', { engineOptions: { customRules: [rule] }, runOnly: ['org-tiers'] });
  const h = renderHtmlReport(r, { manualChecks: false });
  const text = h.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const k of ['AFAILS','BPASSES']) { const i = text.indexOf(k); console.log(k, '...', text.slice(Math.max(0,i-300), i+60)); }
  console.log('counts', (text.match(/\d+ (failure|finding|fail)[a-z]*/gi)||[]).slice(0,10));
})();
