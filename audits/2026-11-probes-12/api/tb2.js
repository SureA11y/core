const http = require('http'); const fs = require('fs');
const { chromium } = require('/home/user/r12-api/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/r12-api/surea11y.browser.js');
(async () => {
  let nreq = 0; const slow = http.createServer((q, s) => { nreq++; setTimeout(() => { s.setHeader('content-type', 'text/css'); s.setHeader('access-control-allow-origin', '*'); s.end('p{color:#000}'); }, nreq > 1 ? 3000 : 0); });
  await new Promise(r => slow.listen(0, r));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title><link rel="stylesheet" href="http://localhost:${slow.address().port}/s.css"><script src="/core.js"></script></head><body><main><h1>t</h1><img src="a.png"></main></body></html>`;
  const srv = http.createServer((q, s) => { if (q.url === '/core.js') { s.setHeader('content-type', 'text/javascript'); return s.end(bundle); } if (q.url !== '/') { s.statusCode = 404; return s.end(); } s.setHeader('content-type', 'text/html'); s.end(html); });
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await br.newPage();
  await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.a11ycore);
  const out = await p.evaluate(async () => { const t0 = performance.now(); const r = await a11ycore.runa11yCoreInPageAsync(location.href, null, { timeBudgetMs: 1000 }, null); return { ms: Math.round(performance.now() - t0), inc: r.engine.incomplete, ran: r.checksResults.length }; });
  console.log(JSON.stringify(out));
  await br.close(); srv.close(); slow.close();
})();
