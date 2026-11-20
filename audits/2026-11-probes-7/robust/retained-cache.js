'use strict';
// How much a finished scan leaves reachable from window.__a11ycoreSharedCache (Chromium).
const C = require('./chrome-lib.js');
const { kinds } = require('./perf-pages.js');
const n = +(process.argv[2] || 10000);
(async () => {
  const b = await C.launch();
  const page = await b.newPage();
  const cdp = await page.context().newCDPSession(page);
  const m = async (label) => {
    for (let k = 0; k < 3; k++) await cdp.send('HeapProfiler.collectGarbage');
    const h = await cdp.send('Runtime.getHeapUsage');
    const d = await cdp.send('Memory.getDOMCounters');
    const o = { label, heapMB: +(h.usedSize / 1048576).toFixed(2), nodes: d.nodes };
    console.log(JSON.stringify(o));
    return o;
  };
  await page.setContent(kinds.mixed(n));
  await C.inject(page);
  const a = await m('before scan');
  await page.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 1; });
  const b1 = await m('after scan');
  const keys = await page.evaluate(() => { const c = window.__a11ycoreSharedCache; const out = {}; for (const [k, v] of Object.entries(c || {})) { out[k] = {}; for (const [k2, v2] of Object.entries(v || {})) out[k][k2] = v2 instanceof Map ? 'Map(' + v2.size + ')' : v2 instanceof WeakMap ? 'WeakMap' : typeof v2; } return out; });
  console.log(JSON.stringify(keys));
  await page.evaluate(() => { document.querySelector('main').remove(); });
  const c = await m('after removing <main> (SPA navigation)');
  await page.evaluate(() => { delete window.__a11ycoreSharedCache; });
  const d = await m('after deleting window.__a11ycoreSharedCache');
  console.log(JSON.stringify({ n, retainedByCacheMB: +(c.heapMB - d.heapMB).toFixed(2), detachedNodesHeld: c.nodes - d.nodes }));
  await b.close();
})();
