'use strict';
// node prof.js <page> <buildDir>... ; writes self-time by function, aggregated, per build (median of REPS runs summed... just sum)
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const { pages } = require('./pages');
const [pg, ...dirs] = process.argv.slice(2);
const REPS = Number(process.env.REPS || 2);
const pgList = pg.split(','); const htmls = Object.fromEntries(pgList.map((x) => [x, pages[x]()])); let html = '';
const ONLY = process.env.ALL ? null : { type: 'rule', values: ['contrast-computable', 'contrast-enhanced', 'contrast-minimum', 'symbol-graphic-contrast'] };
const bundles = dirs.map((d) => fs.readFileSync(d + '/surea11y.browser.js'));
const srv = http.createServer((req, res) => { const m = req.url.match(/^\/b(\d+)\.js/); if (m) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundles[+m[1]]); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(htmls[req.url.slice(1)]); });
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const agg = dirs.map(() => new Map()); const rt = dirs.map(() => ({}));
  for (const P of pgList) for (let rep = 0; rep < REPS; rep++) for (let bi = 0; bi < dirs.length; bi++) {
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await page.goto(base + '/' + P, { waitUntil: 'load' });
    await page.addScriptTag({ url: `${base}/b${bi}.js` });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    const r = await page.evaluate(async (only) => { const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, only); return (r.perfStats || (r.engine && r.engine.perfStats) || {}).ruleTimings || {}; }, ONLY);
    const { profile } = await cdp.send('Profiler.stop');
    for (const [k, v] of Object.entries(r)) (rt[bi][k] = rt[bi][k] || []).push(typeof v === 'number' ? v : v.ms || v.total || 0);
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const dt = new Map(); for (let i = 0; i < profile.samples.length; i++) dt.set(profile.samples[i], (dt.get(profile.samples[i]) || 0) + profile.timeDeltas[i] / 1000);
    const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    for (const [id, ms] of dt) {
      if (process.env.INCL) { const seen = new Set(); for (let x = id; x !== undefined; x = parent.get(x)) { const cf = byId.get(x).callFrame; const k = (cf.functionName || '(anon)') + ':0'; if (seen.has(k)) continue; seen.add(k); agg[bi].set(k, (agg[bi].get(k) || 0) + ms / REPS); } continue; }
      const n = byId.get(id); const cf = n.callFrame; const key = `${cf.functionName || '(anon)'}:${cf.url ? 'b' : ''}${cf.lineNumber}`; agg[bi].set(key, (agg[bi].get(key) || 0) + ms / REPS); }
    if (process.env.SAVE) fs.writeFileSync(`${process.env.SAVE}-${bi}.cpuprofile`, JSON.stringify(profile));
    await page.close();
  }
  const keys = new Set(agg.flatMap((m) => [...m.keys()]));
  // match by function name only across builds
  const byName = agg.map((m) => { const o = new Map(); for (const [k, v] of m) { const n = k.replace(/:b?\d+$/, ''); o.set(n, (o.get(n) || 0) + v); } return o; });
  const names = new Set(byName.flatMap((m) => [...m.keys()]));
  const rows = [...names].map((n) => [n, ...byName.map((m) => m.get(n) || 0)]).sort((a, b) => Math.abs(b[1] - b[2]) - Math.abs(a[1] - a[2]));
  console.log('total', byName.map((m) => [...m.values()].reduce((a, b) => a + b, 0).toFixed(0)).join(' '));
  for (const r of rows.slice(0, Number(process.env.TOP || 40))) console.log(r.slice(1).map((x) => x.toFixed(1).padStart(8)).join(' '), r[0]);
  const ruleNames = ['contrast-computable', 'contrast-enhanced', 'contrast-minimum', 'symbol-graphic-contrast'];
  console.log('rules', JSON.stringify(rt.map((o) => Object.fromEntries(Object.entries(o).filter(([k]) => ruleNames.some((r) => k.includes(r))).map(([k, v]) => [k, v.map(Math.round)])))));
  await browser.close(); srv.close();
})();
