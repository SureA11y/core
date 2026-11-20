// Median full-scan time (every rule, default options) for two bundles, in
// alternating rounds, per page and viewport width.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const all = require('./pages.js'); const pages = { realistic: all.realistic };
const bundles = { base: fs.readFileSync(__dirname + '/base.browser.js', 'utf8'), new: fs.readFileSync(__dirname + '/new.browser.js', 'utf8') };
const ROUNDS = Number(process.env.ROUNDS || 5);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const width of [1280, 320]) {
    for (const [name, html] of Object.entries(pages)) {
      const t = { base: [], new: [] };
      for (let round = 0; round < ROUNDS; round++) for (const k of round % 2 ? ['new', 'base'] : ['base', 'new']) {
        const p = await b.newPage({ viewport: { width, height: 800 } });
        await p.setContent(html); await p.addScriptTag({ content: bundles[k] });
        t[k].push(await p.evaluate(() => { const s = performance.now(); window.a11ycore.runa11yCoreInPage(null, null, {}, null); return performance.now() - s; }));
        await p.close();
      }
      const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
      const b0 = med(t.base), n0 = med(t.new);
      console.log(`${String(width).padEnd(5)} ${name.padEnd(10)} base ${b0.toFixed(0).padStart(6)} ms   new ${n0.toFixed(0).padStart(6)} ms   ${((n0 / b0 - 1) * 100).toFixed(1).padStart(6)}%`);
    }
  }
  await b.close();
})();
