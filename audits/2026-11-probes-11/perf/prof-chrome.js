'use strict';
// CPU profile of one scan in Chromium. node prof-chrome.js <build> <genpage|scale:shape:n> [top=30] [runOnly]
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('./pages');
const [b, pg, top = 30, ro] = process.argv.slice(2);
let html;
if (pg.startsWith('scale:')) { const [, sh, n] = pg.split(':'); const { S } = require('./scale-chrome'); html = `<!doctype html><html lang=en><head><meta charset=utf-8><title>S</title></head><body><main id=main><h1>S</h1>${S[sh](+n)}</main></body></html>`; }
else if (pg.startsWith('file:')) html = fs.readFileSync(pg.slice(5), 'utf8'); else html = pages[pg]();
const bundle = fs.readFileSync(process.env.UNMIN ? `${__dirname}/unmin-${b}.js` : `/home/user/core-${b}/surea11y.browser.js`);
const srv = http.createServer((req, res) => { if (req.url === '/b.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundle); } if (req.url !== '/') { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage(); await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.addScriptTag({ url: base + '/b.js' });
  if (process.env.OPTS) await page.evaluate((o) => { window.__OPTS = o; }, process.env.OPTS);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const t = Date.now();
  await page.evaluate(async (ro) => { await window.a11ycore.runa11yCoreInPage(null, null, JSON.parse(window.__OPTS || '{}'), ro ? ro.split(',') : null); }, ro || null);
  const wall = Date.now() - t;
  const { profile } = await cdp.send('Profiler.stop');
  fs.writeFileSync(`${__dirname}/prof-${b}-${pg.replace(/[:/]/g, '_')}.cpuprofile`, JSON.stringify(profile));
  const dt = {}; const ids = profile.samples; const td = profile.timeDeltas;
  for (let i = 0; i < ids.length; i++) dt[ids[i]] = (dt[ids[i]] || 0) + td[i];
  const self = {}; const byId = {}; for (const n of profile.nodes) byId[n.id] = n;
  let total = 0;
  for (const n of profile.nodes) { const cf = n.callFrame; const k = `${cf.functionName || '(anon)'}:${cf.lineNumber + 1}`; const v = (dt[n.id] || 0) / 1000; self[k] = (self[k] || 0) + v; total += v; }
  // inclusive by function name
  const incl = {}; const parent = {}; for (const n of profile.nodes) for (const c of n.children || []) parent[c] = n.id;
  for (const n of profile.nodes) { const v = (dt[n.id] || 0) / 1000; if (!v) continue; const seen = new Set(); let x = n.id; while (x != null) { const cf = byId[x].callFrame; const k = `${cf.functionName || '(anon)'}:${cf.lineNumber + 1}`; if (!seen.has(k)) { incl[k] = (incl[k] || 0) + v; seen.add(k); } x = parent[x]; } }
  console.log(`${b} ${pg} wall=${wall}ms sampled=${Math.round(total)}ms`);
  console.log('SELF', Object.entries(self).sort((a, c) => c[1] - a[1]).slice(0, +top).map(([k, v]) => `${k}=${Math.round(v)}`).join(' | '));
  if (process.env.INCL) console.log('INCL', Object.entries(incl).filter(([k]) => !/^\(|anon/.test(k)).sort((a, c) => c[1] - a[1]).slice(0, +process.env.INCL).map(([k, v]) => `${k}=${Math.round(v)}`).join(' | '));
  await browser.close(); srv.close();
})();
