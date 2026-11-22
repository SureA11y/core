'use strict';
// Corpus timing in Chromium, three builds interleaved, 3 reps; writes JSON of total + per-rule ms.
// usage: node corpus-chrome.js <out.json> [subset: fixtures|realistic|all]
const http = require('node:http'); const fs = require('node:fs'); const path = require('node:path');
const { chromium } = require('/home/user/core/node_modules/playwright');
const { pages, fixtures, FIX } = require('./pages');
const BUILDS = (process.env.BUILDS || 'r11,r8,v117').split(',');
const REPS = Number(process.env.REPS || 3);
const bundles = Object.fromEntries(BUILDS.map((b) => [b, fs.readFileSync((b==="r12"?"/home/user/rd11":b==="yours"?"/home/user/r12-speed":b==="main"?"/home/user/core":`/home/user/core-${b}`)+`/surea11y.browser.js`)]));
const gen = {}; for (const [k, f] of Object.entries(pages)) gen[k] = f();
const [out, subset = 'all'] = process.argv.slice(2);
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let m;
  if ((m = u.match(/^\/bundle\/(\w+)\.js$/))) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[m[1]]); }
  if ((m = u.match(/^\/gen\/(\w+)$/))) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(gen[m[1]]); }
  const f = path.join(FIX, u.replace(/^\/fx\//, ''));
  if (u.startsWith('/fx/') && fs.existsSync(f)) { res.writeHead(200, { 'content-type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.css$/.test(f) ? 'text/css' : /\.js$/.test(f) ? 'text/javascript' : 'application/octet-stream' }); return res.end(fs.readFileSync(f)); }
  res.writeHead(404); res.end();
});
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let list = [];
  if (subset !== 'realistic') list.push(...fixtures().map((f) => ['fx:' + f.replace('-all-scenarios.html', ''), '/fx/' + f]));
  if (subset !== 'fixtures') list.push(...Object.keys(gen).map((k) => ['gen:' + k, '/gen/' + k]));
  const res = {};
  for (const [name, url] of list) {
    res[name] = {};
    for (let rep = 0; rep < REPS; rep++) for (const b of BUILDS.slice(rep % BUILDS.length).concat(BUILDS.slice(0, rep % BUILDS.length))) {
      const page = await ctx.newPage();
      try {
        await page.goto(base + url, { waitUntil: 'load', timeout: 30000 });
        await page.addScriptTag({ url: `${base}/bundle/${b}.js` });
        const r = await page.evaluate(async () => {
          const t = performance.now();
          const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null);
          const total = performance.now() - t;
          const ps = r.perfStats || (r.engine && r.engine.perfStats) || {};
          return { total, warm: ps.warmUpMs || 0, rt: ps.ruleTimings || {}, n: r.checksResults.length };
        });
        (res[name][b] = res[name][b] || []).push(r);
      } catch (e) { (res[name][b] = res[name][b] || []).push({ err: String(e).slice(0, 200) }); }
      await page.close();
    }
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    console.log(name, BUILDS.map((b) => `${b}=${Math.round(med(res[name][b].map((x) => x.total || 0)))}`).join(' '));
  }
  fs.writeFileSync(out, JSON.stringify(res));
  await browser.close(); srv.close();
})();
