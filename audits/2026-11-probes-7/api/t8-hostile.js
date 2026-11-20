const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const B = require('/home/user/core/src/baseline.js');
const nasty = '<script>alert(1)</script>"\'&]]>\u0001\u0000\uD800‮{{x}}${y}';
const rule = {
  id: process.argv[2] || 'org-<x>"\'&]]>',
  meta: { title: 'T ' + nasty, description: 'D ' + nasty, tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'], helpUrl: 'javascript:alert(1)' },
  runInPage: new Function('ctx', `const n=${JSON.stringify(nasty)}; const els=[...ctx.document.querySelectorAll('p')]; return { outcome: 'fail', error: 'E'+n, occurrences: els.map((e,i)=>({ __node: e, summary: 'S'+n, hint: 'H'+n, occurrenceOutcome: i? 'cantTell':'fail', uncertainty: i?{code:'judgement-required', needed:'N'+n}:undefined, howToCheck: i?{steps:['st'+n], passWhen:'p'+n, failWhen:'f'+n}:undefined, lean: i?{toward:'fail', why:'W'+n, signals:[{signal:'s'+n, value:n}]}:undefined, data:{details:{reasonCode:'RC'+n}} })) };`)
};
(async () => {
  const html = `<html lang="en"><head><title>t</title></head><body><main><p id="a&quot;&lt;script&gt;x">a</p><p class="&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;" data-x="]]>">b</p></main></body></html>`;
  const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule] } });
  const c = r.checksResults.find(x => x.ruleId === rule.id || x.ruleId === rule.id.toLowerCase());
  console.log('check', c && c.ruleId, c && c.outcome, c && c.occurrences.length, 'skipped', JSON.stringify(r.skippedCustomRules));
  fs.writeFileSync('out-hostile.sarif', renderSarifReport(r));
  fs.writeFileSync('out-hostile.junit.xml', renderJunitReport(r));
  fs.writeFileSync('out-hostile.earl.json', JSON.stringify(renderEarlReport(r)));
  const h = renderHtmlReport(r, { title: 'Title ' + nasty });
  fs.writeFileSync('out-hostile.html', h);
  console.log('html <script>alert count', (h.match(/<script>alert/g)||[]).length, 'onerror= unescaped', /<img[^>]*onerror/i.test(h), 'javascript:', h.includes('javascript:'));
  const base = B.buildBaselineEntries(r); const m = B.matchBaseline(r, base); console.log('baseline n', base.length, 'match new', (m.newOccurrences||m.new||[]).length, Object.keys(m));
})();
