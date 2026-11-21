'use strict';
// Heap snapshot after A and after B scans of the same page; diff object counts/sizes by constructor name.
// node heapdiff.js A B
const C = require('./chrome-lib.js');
const { kinds } = require('./perf-pages.js');
const [A, B] = [+process.argv[2], +process.argv[3]];
async function snap(cdp) {
  for (let k = 0; k < 3; k++) await cdp.send('HeapProfiler.collectGarbage');
  let chunks = [];
  const on = (e) => chunks.push(e.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', on);
  const s = JSON.parse(chunks.join(''));
  const f = s.snapshot.meta.node_fields, nf = f.length;
  const ti = f.indexOf('type'), ni = f.indexOf('name'), si = f.indexOf('self_size');
  const types = s.snapshot.meta.node_types[0];
  const agg = {};
  for (let i = 0; i < s.nodes.length; i += nf) {
    const t = types[s.nodes[i + ti]];
    let name = s.strings[s.nodes[i + ni]];
    if (t === 'string' || t === 'concatenated string' || t === 'sliced string') name = '(string)';
    if (t === 'code') name = '(code)';
    if (t === 'closure') name = 'closure:' + name;
    const key = t + ':' + String(name).slice(0, 60);
    const a = agg[key] || (agg[key] = [0, 0]);
    a[0]++; a[1] += s.nodes[i + si];
  }
  return agg;
}
(async () => {
  const b = await C.launch();
  const page = await b.newPage();
  const cdp = await page.context().newCDPSession(page);
  await page.setContent(kinds.mixed(600));
  await C.inject(page);
  const run = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 1; }, n);
  await run(A);
  const s1 = await snap(cdp);
  await run(B - A);
  const s2 = await snap(cdp);
  const rows = [];
  for (const k of new Set([...Object.keys(s1), ...Object.keys(s2)])) {
    const a = s1[k] || [0, 0], c = s2[k] || [0, 0];
    if (c[1] - a[1] !== 0 || c[0] - a[0] !== 0) rows.push([k, c[0] - a[0], c[1] - a[1]]);
  }
  rows.sort((x, y) => y[2] - x[2]);
  console.log(`after ${A} vs ${B} scans; top growth (count, bytes):`);
  for (const r of rows.slice(0, 25)) console.log(r[1], r[2], r[0]);
  const tot = rows.reduce((s, r) => s + r[2], 0);
  console.log('total bytes delta', tot, 'per scan', (tot / (B - A)).toFixed(0));
  await b.close();
})();
