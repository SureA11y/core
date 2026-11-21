// Hostile strings through every reporter.
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const B = require('/home/user/core-r8/src/baseline.js');
const fs = require('fs');
const evil = 'A\u0000B\u0001C\u000bD￾E\uD800F]]>G</script><img src=x onerror=alert(1)>"\'&{{x}}\u2028\u2029';
const html = '<html lang="en"><head><title>' + 'T&lt;/title&gt;' + '</title></head><body><main><p id="a" title="x">x</p></main></body></html>';
const rule = { id: 'org-evil', meta: { title: evil, description: evil, tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'], helpUrl: 'javascript:alert(1)' },
  runInPage: `function(ctx){ return { outcome: 'fail', occurrences: [{ selector: '#a', message: ${JSON.stringify(evil)}, summary: ${JSON.stringify(evil)}, hint: ${JSON.stringify(evil)}, data: { details: { reasonCode: ${JSON.stringify(evil)} } } }] }; }` };
(async () => {
  const r = await runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: ['org-evil'] }, engineOptions: { customRules: [rule] } });
  r.url = 'javascript:alert(1)//' + evil;
  const out = {};
  for (const [n, f] of Object.entries({ sarif: () => renderSarifReport(r), junit: () => renderJunitReport(r, { name: evil }), earl: () => JSON.stringify(renderEarlReport(r)), html: () => renderHtmlReport(r, { title: evil }), base: () => JSON.stringify(B.buildBaselineEntries(r)) })) {
    try { out[n] = f(); fs.writeFileSync('out-p05.' + n, out[n]); console.log(n, 'len', out[n].length); } catch (e) { console.log(n, 'THROW', e.message.slice(0, 200)); }
  }
  const j = out.junit || '';
  const bad = j.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g);
  console.log('junit invalid XML chars:', bad && bad.map(c => c.charCodeAt(0).toString(16)));
  console.log('junit has raw ]]> in CDATA?', /<!\[CDATA\[[^]*?\]\]>[^]*?\]\]>/.test(j) ? 'check' : 'no', 'CDATA count', (j.match(/CDATA/g)||[]).length);
  const h = out.html || '';
  console.log('html raw <script> count', (h.match(/<script/gi) || []).length, 'onerror raw', /<img src=x onerror/.test(h), 'javascript: href', /href="javascript:/i.test(h));
  try { JSON.parse(out.sarif); console.log('sarif json ok'); } catch (e) { console.log('sarif bad json'); }
  const s = JSON.parse(out.sarif);
  console.log('sarif helpUri', JSON.stringify(s.runs[0].tool.driver.rules.map(x => x.helpUri)));
})();
