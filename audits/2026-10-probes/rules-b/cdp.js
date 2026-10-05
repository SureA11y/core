const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage();
  for (const n of [5000, 10000, 20000, 40000]) {
    console.log(n, await p.evaluate((n) => { document.body.innerHTML = '<p>x</p>'.repeat(n); const ps = document.querySelectorAll('p'); const t = performance.now(); let best = ps[0]; let c = 0; for (let i = 1; i < n; i++) { const pos = best.compareDocumentPosition(ps[i]); if (pos & 2) c++; } return Math.round(performance.now() - t); }, n), 'ms');
  }
  await b.close();
})();
