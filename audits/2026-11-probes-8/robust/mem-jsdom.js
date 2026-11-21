'use strict';
// node --expose-gc mem-jsdom.js <same|different|reuse> <N> [page-kind] [n]
const L = require('./lib.js');
const G = require('./gen.js');
const fs = require('fs');
const { kinds } = require('./perf-pages.js');
const [mode, N, kind, size] = [process.argv[2], +process.argv[3], process.argv[4] || 'mixed', +(process.argv[5] || 1000)];
console.warn = () => {};
const fixtures = fs.readdirSync('/home/user/core-r8/tests/fixtures').filter((f) => f.endsWith('.html')).sort().map((f) => fs.readFileSync('/home/user/core-r8/tests/fixtures/' + f, 'utf8'));
const base = kinds[kind](size);
const tick = () => new Promise((r) => setImmediate(r));
async function heap() { for (let i = 0; i < 4; i++) { await tick(); global.gc(); } return process.memoryUsage().heapUsed / 1048576; }
(async () => {
  const pts = [];
  let reuse = mode === 'reuse' ? L.open(base) : null;
  for (let i = 0; i <= N; i++) {
    if (i % 10 === 0) pts.push([i, +(await heap()).toFixed(2)]);
    if (i === N) break;
    let html = base;
    if (mode === 'different') html = i % 2 ? fixtures[i % fixtures.length] : G.make(i + 1000, { budget: 200 });
    const { dom } = L.scanJsdom(html, {}, null, reuse || undefined);
    if (!reuse) try { dom.window.close(); } catch {}
    await tick();
  }
  global.window = undefined; global.document = undefined;
  const after = await heap();
  const first = pts[1] ? pts[1][1] : pts[0][1];
  const last = pts[pts.length - 1][1];
  console.log(JSON.stringify({ mode, N, kind, size, points: pts, perScanKB: +(((last - first) * 1024) / (N - 10)).toFixed(1), afterRelease: +after.toFixed(2) }));
})();
