'use strict';
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('./pages');
const [pg, ns = '0,5,20,40'] = process.argv.slice(2);
const B = ['r11', 'r8', 'v117']; const bundles = Object.fromEntries(B.map((b) => [b, fs.readFileSync(`/home/user/core-${b}/surea11y.browser.js`)]));
const html = pages[pg]();
const srv = http.createServer((req, res) => { let m; if ((m = req.url.match(/^\/bundle\/(\w+)\.js$/))) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[m[1]]); } if (req.url !== '/') { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  for (const n of ns.split(',').map(Number)) {
    const r = {};
    for (let i = 0; i < 3; i++) for (const b of B) {
      const p = await ctx.newPage(); await p.goto(base + '/', { waitUntil: 'domcontentloaded' }); await p.addScriptTag({ url: `${base}/bundle/${b}.js` });
      const x = await p.evaluate(async (n) => { const o = { perfStats: true, profileRules: true, excludeSelectors: Array.from({ length: n }, (_, i) => `.nope${i} *`) }; const t = performance.now(); const r = await window.a11ycore.runa11yCoreInPage(null, null, o, null); return { ms: performance.now() - t, rt: r.perfStats.ruleTimings }; }, n);
      (r[b] = r[b] || []).push(x); await p.close();
    }
    console.log(pg, `excl=${n}`, B.map((b) => `${b}=${med(r[b].map((x) => x.ms)).toFixed(0)}`).join(' '), '| r11 top:', Object.keys(r.r11[0].rt).map((k) => [k, med(r.r11.map((x) => x.rt[k]))]).sort((a, c) => c[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(' '));
  }
  await browser.close(); srv.close();
})();
