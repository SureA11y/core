'use strict';
// Repeated scans with a pack in one page: heap after GC and the shared cache
// the bundle keeps on window, with and without packs, and with the DOM
// changing between scans.
const L = require('./lib');
const { packScript } = L.packApi;
const P = L.pack({ name: 'm', namespace: 'm', rules: [L.rule('m-a', (ctx) => ({ outcome: 'fail', occurrences: Array.from(ctx.document.querySelectorAll('p')).map((p) => ({ __node: p })) }))] });
(async () => {
  const browser = await L.chromium.launch({ args: ['--js-flags=--expose-gc'] });
  try {
    for (const packs of [null, ['m@1.0.0']]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main id="m"></main></body></html>');
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript([P]) });
      const heap = () => page.evaluate(() => { window.gc(); return Math.round(performance.memory.usedJSHeapSize / 1e5) / 10; });
      const cache = () => page.evaluate(() => { const c = window.__a11ycoreSharedCache; if (!c) return null; try { return Object.keys(c).map((k) => `${k}:${c[k] && (c[k].size != null ? c[k].size : Object.keys(c[k]).length)}`).join(' '); } catch (e) { return String(e); } });
      const rows = [];
      for (let round = 0; round <= 200; round++) {
        await page.evaluate(([packs, round]) => {
          const m = document.getElementById('m');
          m.innerHTML = '';
          for (let i = 0; i < 200; i++) { const p = document.createElement('p'); p.textContent = 'r' + round + ' ' + i; m.appendChild(p); }
          window.a11ycore.runa11yCoreInPage(null, null, packs ? { packs } : {}, null);
        }, [packs, round]);
        if (round % 50 === 0) rows.push({ round, heapMB: await heap(), cache: await cache() });
      }
      L.log(packs ? 'with pack' : 'without pack', rows);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
})();
