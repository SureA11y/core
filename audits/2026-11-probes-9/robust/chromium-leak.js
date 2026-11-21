'use strict';
// Repeated scans in one Chromium page: JS heap and DOM node count after forced GC.
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const N = Number(process.argv[2] || 20);
const file = process.argv[3] || 'combined.html';
const html = fs.readFileSync(__dirname + '/' + file, 'utf8');
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(s.base + '/c');
  await addBundle(page, s.base);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const measure = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.collectGarbage');
    const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    return { heap: (m.JSHeapUsedSize / 1e6).toFixed(2), nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, frames: m.Frames, sheets: await page.evaluate(() => document.styleSheets.length) };
  };
  console.log('before', JSON.stringify(await measure()));
  await page.evaluate(() => { for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); void cs.color; el.getClientRects(); for (const p of ['::before', '::after', '::marker']) void getComputedStyle(el, p).content; } const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let t = tw.nextNode(); t; t = tw.nextNode()) { const r = document.createRange(); r.selectNodeContents(t); r.getClientRects(); } for (const el of document.querySelectorAll('a,button,input,select,textarea,[tabindex]')) { el.focus(); el.blur(); } void document.body.innerText; });
  console.log('touched', JSON.stringify(await measure()));
  for (let i = 0; i < N; i++) {
    const t = Date.now();
    await page.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 0; });
    const dt = Date.now() - t;
    if (i < 3 || i % 5 === 4) console.log('scan', i, dt + 'ms', JSON.stringify(await measure()));
  }
  await browser.close();
  s.close();
})();
