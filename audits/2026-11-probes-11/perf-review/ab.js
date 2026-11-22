'use strict';
// A/B of runOnly rules across builds, interleaved. node ab-rule.js <rules> <page1,page2> [reps=5] [builds]
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('../perf/pages');
const [rules, pgs, reps = 5, builds = 'r11,r8,v117'] = process.argv.slice(2);
const B = builds.split(',');
const bundles = Object.fromEntries(B.map((b) => [b, fs.readFileSync(b==='rev'?'/home/user/r11-perf-review/surea11y.browser.js':`/home/user/core-${b}/surea11y.browser.js`)]));
const html = {}; for (const p of pgs.split(',')) { if (p.startsWith('scale:')) { const [, sh, n] = p.split(':'); const { S } = require('../perf/scale-chrome'); html[p] = `<!doctype html><html lang=en><head><meta charset=utf-8><title>S</title></head><body><main id=main><h1>S</h1>${S[sh](+n)}</main></body></html>`; } else html[p] = pages[p](); }
const srv = http.createServer((req, res) => { const u = decodeURIComponent(req.url); let m; if ((m = u.match(/^\/bundle\/(\w+)\.js$/))) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[m[1]]); } if (html[u.slice(1)]) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(html[u.slice(1)]); } res.writeHead(404); res.end(); });
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  for (const p of Object.keys(html)) {
    const r = {};
    for (let i = 0; i < +reps; i++) for (const b of (i % 2 ? B.slice().reverse() : B)) {
      const pg = await ctx.newPage(); await pg.goto(`${base}/${encodeURIComponent(p)}`, { waitUntil: 'domcontentloaded' }); await pg.addScriptTag({ url: `${base}/bundle/${b}.js` });
      const x = await pg.evaluate(async (ro) => { const t = performance.now(); const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, ro === 'all' ? null : ro.split(',')); return { total: performance.now() - t, rt: r.perfStats.ruleTimings, occ: r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + (c.occurrences || []).length).join(' ') }; }, rules);
      (r[b] = r[b] || []).push(x); await pg.close();
    }
    const ids = process.env.IDS ? process.env.IDS.split(',') : rules === 'all' ? [] : rules.split(',');
    console.log(p, B.map((b) => `${b}: total=${med(r[b].map((x) => x.total)).toFixed(0)} ${ids.map((id) => `${id}=${med(r[b].map((x) => x.rt[id] || 0)).toFixed(0)}`).join(' ')}`).join(' | '));
    if (process.env.OCC) for (const b of B) console.log('   ', b, r[b][0].occ.slice(0, 300));
  }
  await browser.close(); srv.close();
})();
