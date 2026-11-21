const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
(async () => {
  console.warn = (...a) => console.log('  warn', String(a[0]).slice(0, 120));
  for (const ts of [undefined, 'yesterday', '2026-13-45T99:99:99Z', '2026-01-01', '<b>x</b>', '1e21', '2026-01-01T00:00:00+14:00']) {
    let r; try { r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><img src="a"></body></html>', { engineOptions: { timestamp: ts, strictOptions: true }, runOnly: ['img-alt-present'] }); } catch (e) { console.log(JSON.stringify(ts), 'scan THROW', e.message.slice(0, 100)); continue; }
    let h, j, s, e;
    try { h = (renderHtmlReport(r).match(/<title>([^<]*)/) || [])[1]; } catch (x) { h = 'THROW ' + x.message.slice(0, 60); }
    try { j = (renderJunitReport(r).match(/timestamp="([^"]*)"/) || [])[1]; } catch (x) { j = 'THROW ' + x.message.slice(0, 60); }
    try { s = JSON.stringify((JSON.parse(renderSarifReport(r)).runs[0].invocations || [{}])[0]); } catch (x) { s = 'THROW ' + x.message.slice(0, 60); }
    try { e = JSON.stringify(renderEarlReport(r)).match(/"(dct:date|date|timestamp)":"[^"]*"/); e = e && e[0]; } catch (x) { e = 'THROW ' + x.message.slice(0, 60); }
    console.log(String(JSON.stringify(ts)).padEnd(28), 'result.timestamp=', JSON.stringify(r.timestamp), '| html title:', h, '| junit ts:', j, '| sarif inv:', (s || '').slice(0, 120), '| earl:', e);
  }
})();
