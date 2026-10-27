'use strict';
// Control for 08-memory.js: the same scans with no packs, and jsdom alone.
const { scan, quiet, JSDOM } = require('./lib.js');
const N = Number(process.argv[2] || 300);
const mode = process.argv[3] || 'scan';
const heap = () => { global.gc(); global.gc(); return Math.round(process.memoryUsage().heapUsed / 1e6); };
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';
const h0 = heap(); const s = [];
for (let i = 0; i < N; i++) {
  if (mode === 'scan') quiet(() => scan({}, { html }));
  else { const d = new JSDOM(html, { pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document; d.window.close(); }
  if ((i + 1) % (N / 5) === 0) s.push(`${i + 1}:${heap()}MB`);
}
console.log(`mode=${mode} heap start ${h0}MB ${s.join(' ')}`);
