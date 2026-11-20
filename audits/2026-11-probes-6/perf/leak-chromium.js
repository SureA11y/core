// Heap after forced GC across 30 full scans in one page, for two bundles:
// growth across scans means something keeps what a scan made.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const html = require('./pages.js')[process.argv[2] || 'fixture'];
const width = Number(process.argv[3] || 320);
async function heapSeries(b, bundle) {
  const p = await b.newPage({ viewport: { width, height: 800 } });
  await p.setContent(html); await p.addScriptTag({ content: bundle });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); const { metrics } = await cdp.send('Performance.getMetrics'); return metrics.find((m) => m.name === 'JSHeapUsedSize').value / 1e6; };
  const series = [];
  await p.evaluate(() => { window.__keep = null; });
  for (let i = 0; i <= 30; i++) {
    if (i % 5 === 0) series.push((await heap()).toFixed(2));
    // Like a host: scan, read the result, let it go.
    await p.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null); return r.checksResults.length; });
  }
  await p.close();
  return series;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--js-flags=--expose-gc'] });
  for (const k of ['base', 'new']) console.log(k.padEnd(5), 'heap MB after scans 0,5..30:', (await heapSeries(b, fs.readFileSync(__dirname + `/${k}.browser.js`, 'utf8'))).join(' '));
  await b.close();
})();
