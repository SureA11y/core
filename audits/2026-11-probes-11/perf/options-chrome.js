'use strict';
// Cost of engine options in Chromium, interleaved, 5 reps. node options-chrome.js <page> [build=r11]
const http = require('node:http'); const fs = require('node:fs');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const { pages } = require('./pages');
const [pg, b = 'r11'] = process.argv.slice(2);
const html = pages[pg](); const bundle = fs.readFileSync(`/home/user/core-${b}/surea11y.browser.js`);
const de = fs.existsSync(`/home/user/core-${b}/surea11y.i18n.de.js`) ? fs.readFileSync(`/home/user/core-${b}/surea11y.i18n.de.js`) : null;
const srv = http.createServer((req, res) => { if (req.url === '/b.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(bundle); } if (req.url === '/de.js' && de) { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(de); } if (req.url !== '/') { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
const V = {
  base: {}, excl3: { excludeSelectors: ['.price', 'footer', '[aria-pressed]'] }, excl20: { excludeSelectors: Array.from({ length: 20 }, (_, i) => `.nope${i} *`) },
  cap5: { output: { maxOccurrencesPerRule: 5 } }, budget: { timeBudgetMs: 1e6 }, noHtml: { output: { includeHtml: false } },
  locale_de: { locale: 'de' }, en301549: { profile: 'en301549-v3.2.1' }, multi2: { profile: ['wcag22-aa', 'wcag21-aa'] }, shadowOff: { includeShadowDom: false }, wcag20a: { profile: 'wcag20-a' }, frames: '__frames'
};
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const r = {};
  for (let i = 0; i < 5; i++) for (const [k, o] of (i % 2 ? Object.entries(V).reverse() : Object.entries(V))) {
    const p = await ctx.newPage(); await p.goto(base + '/', { waitUntil: 'domcontentloaded' }); await p.addScriptTag({ url: base + '/b.js' });
    if (k === 'locale_de' && de) await p.addScriptTag({ url: base + '/de.js' });
    const x = await p.evaluate(async ([k, o]) => {
      const t = performance.now(); let res;
      try {
        if (o === '__frames') res = await window.a11ycore.runa11yCoreAcrossFrames(null, null, {}, null);
        else res = await window.a11ycore.runa11yCoreInPage(null, null, o, null);
      } catch (e) { return { ms: -1, err: String(e).slice(0, 100) }; }
      return { ms: performance.now() - t, rules: (res.checksResults || []).length, kb: Math.round(JSON.stringify(res).length / 1024) };
    }, [k, o]);
    (r[k] = r[k] || []).push(x); await p.close();
  }
  const b0 = med(r.base.map((x) => x.ms));
  console.log(pg, b, Object.entries(r).map(([k, v]) => `${k}=${med(v.map((x) => x.ms)).toFixed(0)}ms(${(med(v.map((x) => x.ms)) / b0).toFixed(2)}x,${v[0].kb}KB${v[0].err ? ' ' + v[0].err : ''})`).join(' '));
  await browser.close(); srv.close();
})();
