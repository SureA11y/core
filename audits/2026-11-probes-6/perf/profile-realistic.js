// Profile reflow alone on the deep page with each bundle (CDP Profiler) and
// list the functions by self time, with the difference.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const deep = (() => { let s = ''; for (let i = 0; i < 200; i++) s += '<div>'.repeat(100) + `<span>Item ${i}</span>` + '</div>'.repeat(100); return `<!doctype html><html lang="en"><head><title>t</title></head><body>${s}</body></html>`; })();
async function profile(b, bundle) {
  const p = await b.newPage({ viewport: { width: 320, height: 640 } });
  await p.setContent(fs.readFileSync('/home/user/core/tests/fixtures/index.html','utf8')); await p.addScriptTag({ content: bundle });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null));
  await cdp.send('Profiler.start');
  for (let i = 0; i < 15; i++) await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null));
  const { profile: prof } = await cdp.send('Profiler.stop');
  await p.close();
  const self = {}; const dt = {};
  const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  prof.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'}:${n.callFrame.lineNumber}`; self[k] = (self[k] || 0) + (prof.timeDeltas[i] || 0) / 1000; });
  return self;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const base = await profile(b, fs.readFileSync(process.argv[2], 'utf8'));
  const nw = await profile(b, fs.readFileSync(process.argv[3], 'utf8'));
  const name = (k) => k.replace(/:\d+$/, '');
  const agg = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[name(k)] = (r[name(k)] || 0) + v; return r; };
  const A = agg(base), B = agg(nw);
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].map((k) => [k, (B[k] || 0) - (A[k] || 0), A[k] || 0, B[k] || 0]).sort((x, y) => y[1] - x[1]);
  console.log('total base', Object.values(A).reduce((a, c) => a + c, 0).toFixed(0), 'ms  new', Object.values(B).reduce((a, c) => a + c, 0).toFixed(0), 'ms (5 scans)');
  for (const [k, d, a, n] of keys.slice(0, 12)) console.log(k.padEnd(40), 'base', a.toFixed(0).padStart(5), ' new', n.toFixed(0).padStart(5), ' diff', d.toFixed(0));
  await b.close();
})();
