'use strict';
// node bench.js <pages,comma> <dir>... : only the contrast rules, interleaved, REPS each; medians per rule + CPU (TaskDuration delta)
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const { pages } = require('./pages');
const [pgs, ...dirs] = process.argv.slice(2);
const REPS = Number(process.env.REPS || 5);
const ONLY = process.env.ALL ? null : { type: 'rule', values: ['contrast-computable', 'contrast-enhanced', 'contrast-minimum', 'symbol-graphic-contrast'] };
const html = {}; for (const p of pgs.split(',')) html[p] = pages[p]();
const bundles = dirs.map((d) => fs.readFileSync(d + '/surea11y.browser.js'));
const srv = http.createServer((req, res) => { const m = req.url.match(/^\/b(\d+)\.js/); if (m) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[+m[1]]); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(html[req.url.slice(1)]); });
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sums = dirs.map(() => ({}));
  for (const p of Object.keys(html)) {
    const R = dirs.map(() => ({}));
    for (let rep = 0; rep < REPS; rep++) for (let k = 0; k < dirs.length; k++) {
      const bi = (k + rep) % dirs.length;
      const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      await page.goto(base + '/' + p, { waitUntil: 'load' });
      await page.addScriptTag({ url: `${base}/b${bi}.js` });
      await cdp.send('Performance.enable');
      const m0 = (await cdp.send('Performance.getMetrics')).metrics.find((x) => x.name === 'TaskDuration').value;
      const rt = await page.evaluate(async (only) => { const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, only); return (r.perfStats || (r.engine && r.engine.perfStats) || {}).ruleTimings || {}; }, ONLY);
      const m1 = (await cdp.send('Performance.getMetrics')).metrics.find((x) => x.name === 'TaskDuration').value;
      const o = R[bi]; (o.cpu = o.cpu || []).push((m1 - m0) * 1000);
      for (const [k2, v] of Object.entries(rt)) if (/contrast/.test(k2)) (o[k2] = o[k2] || []).push(v);
      await page.close();
    }
    console.log(p, R.map((o, i) => `[${i}] ` + Object.entries(o).map(([k2, v]) => `${k2.replace('contrast', 'c')}=${Math.round(med(v))}`).join(' ')).join('  '));
    R.forEach((o, i) => { for (const [k2, v] of Object.entries(o)) sums[i][k2] = (sums[i][k2] || 0) + med(v); });
  }
  sums.forEach((o, i) => console.log('SUM', i, Object.entries(o).map(([k2, v]) => `${k2.replace('contrast', 'c')}=${Math.round(v)}`).join(' ')));
  await browser.close(); srv.close();
})();
