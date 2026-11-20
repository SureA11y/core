const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const B = require('/home/user/core/src/baseline.js');
const core = require('/home/user/core/src/index.js');
const N = +process.argv[2] || 5000;
(async () => {
  const html = '<html lang="en"><head><title>t</title></head><body><main>' + Array.from({length:N},(_, i)=>`<img src="${i}.png"><button></button><a href="/${i}">click here</a>`).join('') + '</main></body></html>';
  let t = Date.now();
  const r = await runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  console.log('scan', Date.now()-t, 'ms; occ', r.checksResults.reduce((a,c)=>a+c.occurrences.length,0));
  for (const [n, f] of [['sarif', () => renderSarifReport(r)], ['junit', () => renderJunitReport(r)], ['earl', () => renderEarlReport(r)], ['html', () => renderHtmlReport(r)], ['baseline', () => B.buildBaselineEntries(r)], ['match', () => B.matchBaseline(r, B.buildBaselineEntries(r))], ['addHowToCheck', () => core.addHowToCheck(r)], ['leaning', () => core.leaningFailures(r)]]) {
    t = Date.now(); const out = f(); console.log(n, Date.now()-t, 'ms', typeof out === 'string' ? (out.length/1e6).toFixed(1)+'MB' : '');
  }
})();
