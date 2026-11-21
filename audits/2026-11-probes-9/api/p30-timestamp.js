const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderHtmlReport } = require('@surea11y/core/report');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderEarlReport } = require('@surea11y/core/earl');
const w = console.warn; let warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
for (const ts of ['2026-07-20T12:00:00Z','2026-07-20T12:00:00+02:00','2026-07-20T12:00:00.123456Z','2026-07-20T12:00Z','2026-07-20t12:00:00z','2026-07-20 12:00:00Z','20260720T120000Z','2026-07-20T24:00:00Z','2026-02-30T12:00:00Z','2026-07-20T12:00:60Z','+002026-07-20T12:00:00Z']) {
  warns=[];
  const r = runa11yCoreOnHtml('<html lang="en"><title>t</title><body></body></html>', { engineOptions: { timestamp: ts }, entryPointParity:false, runOnly:['page-title-present'] });
  let strict; try { runa11yCoreOnHtml('<html lang="en"><title>t</title><body></body></html>', { engineOptions: { timestamp: ts, strictOptions:true }, entryPointParity:false, runOnly:['page-title-present'] }); strict='ok'; } catch(e){ strict='throws'; }
  const h = renderHtmlReport(r); const d = (h.match(/<title>[^<]*/)||[''])[0];
  const j = (renderJunitReport(r).match(/timestamp="[^"]*"/)||[''])[0];
  console.log(ts.padEnd(30), 'result.ts', String(r.timestamp).padEnd(28), 'strict', strict.padEnd(6), d.slice(7).padEnd(48), j, warns.length?'WARN':'');
}
console.warn=w;
