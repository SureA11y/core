// One scan at a time, heap after GC and time per scan.
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const pages = require('./pages.js');
const name = process.argv[2] || 'fixture';
const n = Number(process.argv[3] || 8);
const opts = process.argv[4] ? JSON.parse(process.argv[4]) : {};
const heap = () => { global.gc(); global.gc(); return Math.round(process.memoryUsage().heapUsed / 1e6); };
console.log('start', heap());
for (let i = 1; i <= n; i++) {
  const s = Date.now();
  runa11yCoreOnHtml(pages[name], opts);
  console.log(i, 'ms', Date.now() - s, 'heapMB', heap());
}
