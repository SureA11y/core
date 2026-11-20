// CPU profile of reflow alone, 15 scans, on a page from pages.js at 320px,
// for two bundles; functions by self-time difference.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const html = require('./pages.js')[process.argv[4] || 'realistic'];
async function profile(b, bundle) {
  const p = await b.newPage({ viewport: { width: 320, height: 640 } });
  await p.setContent(html); await p.addScriptTag({ content: bundle });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  const run = () => p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null));
  await run(); await cdp.send('Profiler.start');
  for (let i = 0; i < 15; i++) await run();
  const { profile: prof } = await cdp.send('Profiler.stop'); await p.close();
  const byId = new Map(prof.nodes.map((n) => [n.id, n])); const self = {};
  prof.samples.forEach((id, i) => { const n = byId.get(id); const k = n.callFrame.functionName || '(anon)'; self[k] = (self[k] || 0) + (prof.timeDeltas[i] || 0) / 1000; });
  return self;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const A = await profile(b, fs.readFileSync(process.argv[2], 'utf8')); const B = await profile(b, fs.readFileSync(process.argv[3], 'utf8'));
  const tot = (o) => Object.entries(o).filter(([k]) => k !== '(idle)').reduce((a, [, c]) => a + c, 0);
  console.log('total base', tot(A).toFixed(0), 'new', tot(B).toFixed(0), 'ms (15 scans)');
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].map((k) => [k, (B[k] || 0) - (A[k] || 0), A[k] || 0, B[k] || 0]).sort((x, y) => y[1] - x[1]);
  for (const [k, d, a, n] of keys.slice(0, 12)) console.log(k.padEnd(34), 'base', a.toFixed(0).padStart(5), ' new', n.toFixed(0).padStart(5), ' diff', d.toFixed(0));
  await b.close();
})();
