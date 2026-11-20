'use strict';
// node perf-jsdom.js kind n1,n2,... reps  -> JSON lines {kind,n,total,warm,timings}
const L = require('./lib.js');
const { kinds } = require('./perf-pages.js');
const [kind, sizes, reps] = [process.argv[2], process.argv[3].split(',').map(Number), +(process.argv[4] || 3)];
console.warn = () => {};
(async () => {
  for (const n of sizes) {
    const html = kinds[kind](n);
    const runs = [];
    for (let k = 0; k < reps; k++) {
      const dom = L.open(html);
      const elements = dom.window.document.getElementsByTagName('*').length;
      const t = process.hrtime.bigint();
      const r = L.scanJsdom(html, { perfStats: true, profileRules: true }, null, dom).r;
      const total = Number(process.hrtime.bigint() - t) / 1e6;
      runs.push({ total, warm: r.perfStats.warmUpMs, t: r.perfStats.ruleTimings, elements });
      try { dom.window.close(); } catch {}
      await new Promise((res) => setImmediate(res));
    }
    const med = (f) => L.median(runs.map(f));
    const timings = {};
    for (const id of Object.keys(runs[0].t)) timings[id] = +med((x) => x.t[id]).toFixed(1);
    console.log(JSON.stringify({ env: 'jsdom', kind, n, elements: runs[0].elements, total: +med((x) => x.total).toFixed(0), warm: +med((x) => x.warm).toFixed(0), timings }));
  }
})();
