'use strict';
// Repeated scans in one Chromium page. usage: node leak-chrome.js <build> <page> <N> [optsJSON]
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('./pages');
const [b, pg, N = 30, opts = '{}'] = process.argv.slice(2);
const bundle = fs.readFileSync((b==="r12"?"/home/user/r12-api":`/home/user/core-${b}`)+`/surea11y.browser.js`);
const html = pages[pg]().replace('<head>', `<head><script>
window.__timers=new Set();const st=setTimeout,ct=clearTimeout,si=setInterval,ci=clearInterval;
window.setTimeout=function(f,d,...a){const id=st(function(){__timers.delete(id);return typeof f==='function'?f.apply(this,arguments):undefined},d,...a);__timers.add(id);return id};
window.clearTimeout=function(id){__timers.delete(id);return ct(id)};
window.__ivals=new Set();window.setInterval=function(...a){const id=si(...a);__ivals.add(id);return id};window.clearInterval=function(id){__ivals.delete(id);return ci(id)};
window.__raf=0;const raf=requestAnimationFrame;window.requestAnimationFrame=function(f){window.__raf++;return raf(function(t){window.__raf--;return f(t)})};
window.__mo=0;const MO=MutationObserver;window.MutationObserver=class extends MO{observe(...a){window.__mo++;return super.observe(...a)}disconnect(){window.__mo--;return super.disconnect()}};
</script>`);
const srv = http.createServer((req, res) => { if (req.url === '/b.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundle); } if (req.url !== '/') { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const g0 = await page.evaluate(() => Object.getOwnPropertyNames(window).length);
  await page.addScriptTag({ url: base + '/b.js' });
  const g1 = await page.evaluate(() => Object.getOwnPropertyNames(window));
  const measure = async () => {
    for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
    const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    let det = '?';
    try { det = (await cdp.send('DOM.getDetachedDomNodes')).detachedNodes.length; } catch (e) { }
    const pg = await page.evaluate((g1) => ({ sheets: document.styleSheets.length, adopted: document.adoptedStyleSheets.length, els: document.getElementsByTagName('*').length, iframes: document.querySelectorAll('iframe').length, timers: window.__timers.size, ivals: window.__ivals.size, raf: window.__raf, mo: window.__mo, newGlobals: Object.getOwnPropertyNames(window).filter((k) => !g1.includes(k)), attrs: [...document.querySelectorAll('*')].reduce((a, e) => a + e.attributes.length, 0), scrollY: scrollY }), g1);
    return { heap: +(m.JSHeapUsedSize / 1e6).toFixed(2), nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, frames: m.Frames, det, ...pg };
  };
  console.log(b, pg, 'globals added by bundle:', g1.length - g0);
  console.log('before', JSON.stringify(await measure()));
  const times = [];
  for (let i = 0; i < Number(N); i++) {
    const t = Date.now();
    await page.evaluate(async (o) => { await window.a11ycore.runa11yCoreInPage(null, null, JSON.parse(o), null); return 0; }, opts);
    times.push(Date.now() - t);
    if (i < 2 || i % 10 === 9 || i === N - 1) console.log('scan', i + 1, times[i] + 'ms', JSON.stringify(await measure()));
  }
  await new Promise((r) => setTimeout(r, 1500));
  console.log('after 1.5s idle', JSON.stringify(await measure()));
  console.log('times', times.join(','));
  await browser.close(); srv.close();
})();
