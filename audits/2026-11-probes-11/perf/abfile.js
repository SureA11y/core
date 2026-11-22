'use strict';
// A/B of bundle files: node abfile.js <rules> <page> <file1,file2,...> [reps]
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('./pages');
const [rules, pg, files, reps = 5] = process.argv.slice(2);
const F = files.split(','); const bundles = F.map((f) => fs.readFileSync(f));
let html; if (pg.startsWith('scale:')) { const [, sh, n] = pg.split(':'); const { S } = require('./scale-chrome'); html = `<!doctype html><html lang=en><head><meta charset=utf-8><title>S</title></head><body><main id=main><h1>S</h1>${S[sh](+n)}</main></body></html>`; } else html = pages[pg]();
const srv = http.createServer((req, res) => { let m; if ((m = req.url.match(/^\/b(\d+)\.js$/))) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[+m[1]]); } if (req.url !== '/') { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const r = F.map(() => []); const occ = F.map(() => '');
  for (let i = 0; i < +reps; i++) for (let j = 0; j < F.length; j++) {
    const p = await ctx.newPage(); await p.goto(base + '/', { waitUntil: 'domcontentloaded' }); await p.addScriptTag({ url: `${base}/b${j}.js` });
    const x = await p.evaluate(async (ro) => { const t = performance.now(); const r = await window.a11ycore.runa11yCoreInPage(null, null, JSON.parse(window.__O || '{}'), ro === 'all' ? null : ro.split(',')); return { ms: performance.now() - t, sig: JSON.stringify(r.checksResults.map((c) => [c.ruleId, c.outcome, (c.occurrences || []).map((o) => o.outcome + (o.reasonCode || '')).join()])) }; }, rules);
    r[j].push(x.ms); occ[j] = x.sig; await p.close();
  }
  console.log(pg, rules, F.map((f, j) => `${f.split('/').pop()}=${med(r[j]).toFixed(0)}`).join(' '), '| same results:', occ.every((o) => o === occ[0]));
  await browser.close(); srv.close();
})();
