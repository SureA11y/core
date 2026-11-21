'use strict';
// Per-rule time, 1.17.0 bundle vs main bundle, Chromium, interleaved, median of reps, at n and 2n.
// Flags: rule clearly slower than 1.17.0 (ratio>1.3 and +10ms), rule growing super-linearly (2n/n > 2.6 and >=20ms at 2n).
// node perf-compare.js kinds n reps
const fs = require('fs');
const { chromium } = require('/home/user/core-r8/node_modules/playwright');
const L = require('./lib.js');
const { kinds } = require('./perf-pages.js');
const extra = require('./perf-pages2.js');
Object.assign(kinds, extra.kinds);
const B = { base: fs.readFileSync('/tmp/surea11y-audit/r7/robust/base.browser.js', 'utf8'), head: fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8') };
const [kindList, n0, reps] = [process.argv[2].split(','), +process.argv[3], +(process.argv[4] || 5)];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const kind of kindList) {
    const per = {};
    for (const n of [n0, 2 * n0]) {
      const html = kinds[kind](n);
      const t = { base: [], head: [] };
      for (let k = 0; k < reps; k++) {
        for (const v of k % 2 ? ['head', 'base'] : ['base', 'head']) {
          const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
          await p.setContent(html, { timeout: 120000 });
          await p.evaluate(B[v]);
          const r = await p.evaluate(() => {
            const t = performance.now();
            const r = window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null);
            return { total: performance.now() - t, rt: r.perfStats.ruleTimings, el: document.getElementsByTagName('*').length };
          });
          t[v].push(r);
          await p.close();
        }
      }
      per[n] = {};
      for (const v of ['base', 'head']) {
        const ids = Object.keys(t[v][0].rt);
        per[n][v] = { total: L.median(t[v].map((x) => x.total)), el: t[v][0].el, rt: Object.fromEntries(ids.map((id) => [id, L.median(t[v].map((x) => x.rt[id] || 0))])) };
      }
    }
    const [a, c] = [per[n0], per[2 * n0]];
    const slower = [], superlin = [];
    for (const id of Object.keys(c.head.rt)) {
      const hb = c.base.rt[id];
      if (hb != null && c.head.rt[id] > 1.3 * hb && c.head.rt[id] - hb > 10) slower.push(`${id} ${hb.toFixed(0)}->${c.head.rt[id].toFixed(0)}`);
      const g = c.head.rt[id] / Math.max(a.head.rt[id], 0.5);
      if (c.head.rt[id] >= 20 && g > 2.6) superlin.push(`${id} ${a.head.rt[id].toFixed(0)}->${c.head.rt[id].toFixed(0)} (x${g.toFixed(1)})`);
    }
    const top = Object.entries(c.head.rt).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k, v]) => `${k}=${v.toFixed(0)}`);
    console.log(JSON.stringify({ kind, n: n0, el: [a.head.el, c.head.el], totalBase: [a.base.total, c.base.total].map((x) => +x.toFixed(0)), totalHead: [a.head.total, c.head.total].map((x) => +x.toFixed(0)), slowerThanBase: slower, superLinear: superlin, top2n: top }));
  }
  await b.close();
})();
