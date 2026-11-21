'use strict';
// CPU profile of one rule on a generated page in Chromium; prints top self-time functions with source snippets.
// node profile-rule.js <rule> <n> [shape] [coreDir]
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const [rule, nArg, shapeArg, core] = process.argv.slice(2);
if (core) process.env.CORE = core;
const n = Number(nArg || 8000);
const shape = shapeArg || 'cards';
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'kappa', 'sigma', 'theta'];
const w = (i) => words[i % 8] + ' ' + words[(i * 7) % 8];
const shapes = {
  cards: (n) => `<div class=grid>${Array.from({ length: n }, (_, i) => `<article class=card><img src="/i/${i}.png" alt="Product ${i}"><h3 id=h${i}>${w(i)}</h3><p class=price>$${i}.99</p><button aria-describedby=h${i}>Add to cart</button><a href="/p/${i}">Details<span class=sr>${w(i)}</span></a></article>`).join('')}</div>`,
  paras: (n) => Array.from({ length: n }, (_, i) => `<p>${w(i)} ${i}</p>`).join(''),
  divs: (n) => Array.from({ length: n }, (_, i) => `<div>${w(i)} ${i}</div>`).join(''),
  articles: (n) => Array.from({ length: n }, (_, i) => `<article><p>${w(i)} ${i}</p></article>`).join(''),
  imgs: (n) => Array.from({ length: n }, (_, i) => `<div><img src="/i/${i}.png" alt="P ${i}"> t${i}</div>`).join(''),
  buttons: (n) => Array.from({ length: n }, (_, i) => `<div><button>B ${i}</button></div>`).join(''),
  imgsData: (n) => Array.from({ length: n }, (_, i) => `<div><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="P ${i}"> t${i}</div>`).join(''),
  imgsSized: (n) => Array.from({ length: n }, (_, i) => `<div><img src="/i/${i}.png" width=40 height=40 alt="P ${i}"> t${i}</div>`).join(''),
  imgsNoSrc: (n) => Array.from({ length: n }, (_, i) => `<div><img alt="P ${i}"> t${i}</div>`).join(''),
  imgsEmptyAlt: (n) => Array.from({ length: n }, (_, i) => `<div><img src="/i/${i}.png" alt=""> t${i}</div>`).join(''),
  imgsOnly: (n) => Array.from({ length: n }, (_, i) => `<img src="/i/${i}.png" alt="P ${i}">`).join(''),
  labelList: (n) => `<label>Choose <input type=checkbox><span>${Array.from({ length: n }, (_, i) => `<span>${w(i)}</span> `).join('')}</span></label>`,
  selectInLabel: (n) => `<label>Pick <select>${Array.from({ length: n }, (_, i) => `<option value=${i}>${w(i)} ${i}</option>`).join('')}</select></label>`,
  links: (n) => Array.from({ length: n }, (_, i) => `<div><a href="/p/${i}">L ${i}</a></div>`).join('')
};
(async () => {
  const s = await serve({ '/p': { body: `<!doctype html><html lang=en><title>p</title><main><h1>x</h1>${shapes[shape](n)}</main>` } });
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(s.base + '/p');
  await addBundle(page, s.base);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  if (process.env.PROFILE !== '0') await cdp.send('Profiler.start');
  await cdp.send('Performance.enable');
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const t = Date.now();
  await page.evaluate((r) => window.a11ycore.runa11yCoreInPage(null, null, {}, [r]), rule);
  const dt = Date.now() - t;
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  console.log(`${shape} n=${n} ${rule} ${dt}ms layouts=${m1.LayoutCount - m0.LayoutCount} recalcStyles=${m1.RecalcStyleCount - m0.RecalcStyleCount} layoutMs=${Math.round(1000 * (m1.LayoutDuration - m0.LayoutDuration))} styleMs=${Math.round(1000 * (m1.RecalcStyleDuration - m0.RecalcStyleDuration))}`);
  if (process.env.PROFILE === '0') { await browser.close(); s.close(); return; }
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map();
  const total = profile.samples.length;
  const counts = new Map();
  for (const id of profile.samples) counts.set(id, (counts.get(id) || 0) + 1);
  for (const nd of profile.nodes) {
    const c = counts.get(nd.id) || 0;
    const cf = nd.callFrame;
    const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber}:${cf.columnNumber}`;
    self.set(key, (self.get(key) || 0) + c);
  }
  const bundle = fs.readFileSync((process.env.CORE || '/home/user/core-r9') + '/surea11y.browser.js', 'utf8').split('\n');
  for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    const m = k.match(/surea11y\.browser\.js:(\d+):(\d+)$/);
    const snip = m ? bundle[+m[1]].slice(+m[2], +m[2] + 200) : '';
    console.log(String((100 * v / total).toFixed(1)).padStart(5) + '%', k, snip ? '\n        ' + snip : '');
  }
  await browser.close();
  s.close();
})();
