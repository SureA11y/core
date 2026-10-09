'use strict';
// Heap after N scans/prepares with a fresh pack object each time (cache
// misses), versus the same pack object (cache hits). Run with --expose-gc.
const { scan, quiet, base, rule, packApi } = require('./lib.js');
const N = Number(process.argv[2] || 1000);
const mode = process.argv[3] || 'prepare';
const mk = () => base({ name: 'm', namespace: 'm', rules: [rule('m-a')], dictionaries: { en: { mA_title: 'x' } } });
const heap = () => { global.gc(); global.gc(); return Math.round(process.memoryUsage().heapUsed / 1e6); };
const same = mk();
const h0 = heap();
const t0 = Date.now();
const samples = [];
for (let i = 0; i < N; i++) {
  const p = mode.endsWith('same') ? same : mk();
  if (mode.startsWith('prepare')) packApi.preparePacks([p]);
  else quiet(() => scan({ packs: [p] }, { html: '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>' }));
  if ((i + 1) % (N / 5) === 0) samples.push(`${i + 1}:${heap()}MB`);
}
console.log(`mode=${mode} N=${N} heap start ${h0}MB, ${samples.join(' ')}; ${(Date.now() - t0) / N} ms/iter`);
