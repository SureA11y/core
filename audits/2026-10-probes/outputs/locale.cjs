const {launch,serve,scanPage}=require('./lib.cjs'); const P=require('./pages.cjs'); const C='./proj/node_modules/@surea11y/core/';
const {renderHtmlReport}=require(C+'src/report.js'); const {renderSarifReport}=require(C+'src/sarif.js'); const {renderJunitReport}=require(C+'src/junit.js');
(async()=>{ const {server,base}=await serve({'/v':{body:P.violations}}); const b=await launch(); const page=await b.newPage(); await page.goto(base+'/v');
 for(const loc of ['de','ja','pt-BR']){ const r=await scanPage(page,base+'/v',null,{locale:loc, timestamp:'2026-01-01T00:00:00Z'});
  const h=renderHtmlReport(r); const s=JSON.parse(renderSarifReport(r)); const j=renderJunitReport(r);
  console.log(loc, 'htmllang', h.match(/<html lang="([^"]+)"/)[1], '| h2:', (h.match(/<h2>([^<]+)<\/h2>/)||[])[1], '| sarif msg:', s.runs[0].results[0].message.text.slice(0,50), '| junit suite:', (j.match(/testsuite name="([^"]+)"/)||[])[1], '| report date from', /2026-01-01|1\. Jan|2026\/1\/1|Jan 1, 2026/.test(h)?'result.timestamp':'wall clock');
 }
 const r1=await scanPage(page,base+'/v',null,{timestamp:'2026-01-01T00:00:00Z'}); const a=renderHtmlReport(r1); await new Promise(r=>setTimeout(r,1100)); const c=renderHtmlReport(r1); console.log('report deterministic for same result:', a===c);
 await b.close(); server.close(); })();
