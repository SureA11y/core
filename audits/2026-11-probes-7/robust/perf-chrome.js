'use strict';
// node perf-chrome.js kind n1,n2 reps  [BUNDLE=path env for older bundle]
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const { kinds } = require('./perf-pages.js');
const [kind, sizes, reps] = [process.argv[2], process.argv[3].split(',').map(Number), +(process.argv[4] || 3)];
(async () => {
  const b = await C.launch();
  for (const n of sizes) {
    const html = kinds[kind](n);
    const runs = [];
    for (let k = 0; k < reps; k++) {
      const p = await b.newPage();
      await p.setContent(html, { timeout: 120000 });
      await C.inject(p);
      const elements = await p.evaluate(() => document.getElementsByTagName('*').length);
      const r = await p.evaluate(() => {
        const t = performance.now();
        const r = window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null);
        return { total: performance.now() - t, warm: r.perfStats.warmUpMs, t: r.perfStats.ruleTimings };
      });
      runs.push({ ...r, elements });
      await p.close();
    }
    const med = (f) => L.median(runs.map(f));
    const timings = {};
    for (const id of Object.keys(runs[0].t)) timings[id] = +med((x) => x.t[id]).toFixed(1);
    console.log(JSON.stringify({ env: 'chrome', kind, n, elements: runs[0].elements, total: +med((x) => x.total).toFixed(0), warm: +med((x) => x.warm).toFixed(0), timings }));
  }
  await b.close();
})();
