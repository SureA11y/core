'use strict';
// Repeated a11ycore.inspect() (console helper) in one page: heap after GC.
// node mem-inspect.js <N> <kind: names|headings|landmarks|focus-order> [draw 0|1] [page: small|mixed]
const C = require('./chrome-lib.js');
const { kinds } = require('./perf-pages.js');
const [N, kind, draw, pg] = [+process.argv[2], process.argv[3] || 'names', process.argv[4] !== '0', process.argv[5] || 'small'];
(async () => {
  const b = await C.launch();
  const page = await b.newPage();
  const cdp = await page.context().newCDPSession(page);
  await page.setContent(pg === 'small' ? '<html lang="en"><title>t</title><body><main><h1>H</h1><button>OK</button><a href="#">x</a></main></body></html>' : kinds.mixed(600));
  await C.inject(page);
  await page.evaluate(() => { console.table = () => {}; console.log = () => {}; });
  const pts = [];
  for (let i = 0; i <= N; i++) {
    if (i % 50 === 0) {
      for (let k = 0; k < 3; k++) await cdp.send('HeapProfiler.collectGarbage');
      const h = await cdp.send('Runtime.getHeapUsage');
      const d = await cdp.send('Memory.getDOMCounters');
      pts.push([i, +(h.usedSize / 1048576).toFixed(3), d.nodes, d.jsEventListeners]);
    }
    if (i === N) break;
    await page.evaluate(([k, draw]) => window.a11ycore.inspect(k, { draw }).then((r) => r.length), [kind, draw]);
  }
  const a = pts[1], z = pts[pts.length - 1];
  console.log(JSON.stringify({ N, kind, draw, pg, points: pts, perCallKB: +(((z[1] - a[1]) * 1024) / (N - 50)).toFixed(2), nodesPerCall: +((z[2] - a[2]) / (N - 50)).toFixed(2) }));
  await b.close();
})();
