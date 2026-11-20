// HTML report card counts a pass-tier occurrence: "× 2" for a rule with one failing element.
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const rule = { id: 'org-tiers', meta: { title: 'Org tiers', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] },
  runInPage(ctx) { return { outcome: 'fail', occurrences: [
    { __node: ctx.document.getElementById('a'), summary: 'AFAILS', hint: 'h', occurrenceOutcome: 'fail', data: { details: { reasonCode: 'X_FAIL' } } },
    { __node: ctx.document.getElementById('b'), summary: 'BPASSES', hint: 'h', occurrenceOutcome: 'pass', data: { details: { reasonCode: 'X_PASS' } } }] }; } };
const r = runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>', { engineOptions: { customRules: [rule] }, runOnly: ['org-tiers'] });
const h = renderHtmlReport(r, { manualChecks: false });
console.log((h.match(/<span class="card-count">[^<]*<\/span>/g) || []).join(' '));
