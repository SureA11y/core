const h = require('./h.js'); const { jscan } = require('./j.js');
const core = require('/home/user/core/src/index.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { buildBaselineEntries } = require('/home/user/core/src/baseline.js');
const page = `<style>html{background:#fff}</style><main><h1>Title</h1><p style="color:#757575">Close text with <a href="#" style="color:#555;text-decoration:none">a link</a> inside.</p>
<button style="width:24.04px;height:30px;padding:0">A</button> <button style="width:40px;height:40px">B</button>
<div style="height:40px;overflow:hidden;width:300px;line-height:1.2">Short text here</div>
<p style="color:#999">fails</p></main>`;
(async () => {
  const a = await h.scan(page, { full: true }); const b = await h.scan(page, { full: true });
  const strip = (r) => JSON.stringify(r);
  console.log('deterministic chromium:', strip(a) === strip(b));
  const j1 = jscan(page, { full: true }), j2 = jscan(page, { full: true });
  console.log('deterministic jsdom:', strip(j1) === strip(j2));
  console.log('leaked keys:', /marginCandidates|measuredElements/.test(strip(a)));
  console.log(JSON.stringify(core.getMargins(a), null, 0));
  console.log('jsdom margins:', JSON.stringify(core.getMargins(j1).map(m => [m.ruleId, m.value, m.threshold])));
  const noM = JSON.parse(strip(a)); for (const c of noM.checksResults) delete c.margin;
  console.log('sarif same', renderSarifReport(a, {}) === renderSarifReport(noM, {}));
  console.log('junit same', renderJunitReport(a, {}) === renderJunitReport(noM, {}));
  console.log('earl same', JSON.stringify(renderEarlReport(a, {})) === JSON.stringify(renderEarlReport(noM, {})));
  console.log('baseline same', JSON.stringify(buildBaselineEntries(a)) === JSON.stringify(buildBaselineEntries(noM)));
  const html = renderHtmlReport(a, {}); const i = html.indexOf('Closest'); console.log(html.slice(html.indexOf('<h2', i - 200), html.indexOf('</table>', i) + 8).replace(/\s+/g, ' ').slice(0, 2500));
  for (const loc of ['de','ja','ar']) { try { const x = renderHtmlReport(a, { locale: loc }); console.log(loc, 'ok', x.length); } catch (e) { console.log(loc, 'ERR', e.message); } }
  await h.close();
})();
