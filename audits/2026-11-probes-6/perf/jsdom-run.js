// Full scans under jsdom with one core (argv[2]: its root): median time per
// page, and heap after GC across 40 scans of fresh documents.
const root = process.argv[2];
const { runa11yCoreOnHtml } = require(root + '/src/testing.js');
const pages = require('./pages.js');
const out = {};
for (const [name, html] of Object.entries(pages)) {
  const t = [];
  for (let i = 0; i < 3; i++) { const s = process.hrtime.bigint(); runa11yCoreOnHtml(html, {}); t.push(Number(process.hrtime.bigint() - s) / 1e6); }
  out[name] = t.sort((a, b) => a - b)[1].toFixed(0);
}
const heap = () => { global.gc(); global.gc(); return (process.memoryUsage().heapUsed / 1e6).toFixed(1); };
const series = [heap()];
for (let i = 1; i <= 20; i++) { runa11yCoreOnHtml(pages.fixture, {}); if (i % 5 === 0) series.push(heap()); }
console.log(JSON.stringify({ ms: out, heapMB: series }));
