const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r10/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r10/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r10/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r10/src/report.js');
const body = '<img src="x.png">'.repeat(7) + '<a href="/a"></a>'.repeat(5) + '<table><tr><td>a</td><td>1</td></tr><tr><td>b</td><td>2</td></tr></table>'.repeat(6) + '<div role="button">x</div>'.repeat(4);
const html = `<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1>${body}</main></body></html>`;
const W = console.warn; console.warn = () => {};
const a = runa11yCoreOnHtml(html, { entryPointParity:false });
const b = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{ output:{ maxOccurrencesPerRule: 2 } } });
const c = runa11yCoreOnHtml(html, { entryPointParity:false, engineOptions:{ output:{ maxOccurrencesPerRule: 2, detail: 'findings' } } });
console.warn = W;
for (const [n, r] of [['full', a], ['cap', b], ['capCompact', c]]) {
  const j = renderJunitReport(r, { leanFailAs: 'failure' });
  const s = JSON.parse(renderSarifReport(r, { leanFailAs: 'error' })); const lv = s.runs[0].results.reduce((m,x)=>(m[x.level]=(m[x.level]||0)+1,m),{});
  const h = renderHtmlReport(r); const text = h.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  const e = renderEarlReport(r); const eo = JSON.stringify(e).match(/earl:(failed|cantTell|passed|inapplicable|untested)/g).reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{});
  console.log(n, (j.match(/<testsuites[^>]*>/)||[])[0], JSON.stringify(lv), 'EARL', JSON.stringify(eo));
  console.log('   html:', (text.match(/\d+ (issues?|findings?|failures?|questions?)[^.]{0,80}/gi)||[]).slice(0,4), (text.match(/\+\d+ more[^.]{0,40}/g)||[]).slice(0,5));
  console.log('   junit more:', (j.match(/\+\d+ more[^<"]{0,40}/g)||[]).slice(0,4), (j.match(/message="[^"]*(more|\d+ occurrence)[^"]*"/g)||[]).slice(0,3));
}
const jb = renderJunitReport(b, { leanFailAs: 'failure' });
for (const id of ['td-has-header', 'widget-keyboard-focusable', 'img-alt-present', 'link-name-present']) { const m = jb.match(new RegExp('<testcase[^>]*' + id + '[\\s\\S]*?</testcase>')); console.log('-----', id, m ? m[0].replace(/\n\s*/g,' | ').slice(0, 900) : 'none'); }
console.log(JSON.stringify(b.checksResults.filter(c=>c.occurrencesOmitted).map(c=>[c.ruleId,c.outcome,c.occurrences.length,c.occurrencesOmitted,c.occurrencesOmittedByOutcome])));
