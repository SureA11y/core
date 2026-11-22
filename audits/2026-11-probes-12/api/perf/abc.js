// Chromium A/B: node abc.js page rules reps
const http = require('http'), fs = require('fs');
const { chromium } = require('/home/user/r12-api/node_modules/playwright');
const [pg, rules, reps = 7] = process.argv.slice(2);
const B = { r12: '/home/user/r12-api', r8: '/home/user/core-r8', v117: '/home/user/core-v117' };
const bundles = Object.fromEntries(Object.entries(B).map(([k, v]) => [k, fs.readFileSync(v + '/surea11y.browser.js')]));
const html = fs.readFileSync(__dirname + '/page-' + pg + '.html');
const srv = http.createServer((q, s) => { const m = q.url.match(/^\/b\/(\w+)\.js/); if (m) { s.setHeader('content-type', 'text/javascript'); return s.end(bundles[m[1]]); } if (q.url !== '/') { s.statusCode = 404; return s.end(); } s.setHeader('content-type', 'text/html'); s.end(html); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  const res = {};
  for (let i = 0; i < +reps; i++) for (const b of Object.keys(B)) {
    const p = await ctx.newPage(); await p.goto(`http://127.0.0.1:${port}/`); await p.addScriptTag({ url: `/b/${b}.js` });
    const t = await p.evaluate((ro) => { const r = a11ycore.runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, ro); return r.perfStats.ruleTimings; }, rules === 'all' ? null : rules.split(','));
    for (const [k, v] of Object.entries(t)) ((res[k] = res[k] || {})[b] = res[k][b] || []).push(v);
    await p.close();
  }
  const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
  for (const [k, v] of Object.entries(res)) console.log(pg, k.padEnd(40), Object.keys(B).map(b => b + '=' + (v[b] ? med(v[b]).toFixed(1) : '-')).join(' '));
  await br.close(); srv.close();
})();
