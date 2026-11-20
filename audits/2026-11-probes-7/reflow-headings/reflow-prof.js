const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const n = Number(process.argv[2] || 20000); const variant = process.argv[3] || 'input';
  const item = variant === 'input' ? (i)=>`<div style="width:400px">Item ${i} <input></div>` : variant==='noinput' ? (i)=>`<div style="width:400px">Item ${i}</div>` : (i)=>`<div style="width:400px"><span>Item ${i}</span></div>`;
  const html = '<!doctype html><body><div style="overflow-x:auto">' + Array.from({length:n},(_,i)=>item(i)).join('') + '</div></body>';
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 320, height: 640 } });
  await page.setContent(html); await page.addScriptTag({ content: BUNDLE });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const t = Date.now();
  await page.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null));
  console.log(variant, n, Date.now() - t, 'ms');
  const { profile } = await cdp.send('Profiler.stop');
  const byId = new Map(profile.nodes.map(n => [n.id, n])); const parent = new Map(); for (const nd of profile.nodes) for (const c of (nd.children||[])) parent.set(c, nd.id);
  const dt = {}; for (let i=0;i<profile.samples.length;i++) dt[profile.samples[i]] = (dt[profile.samples[i]]||0) + (profile.timeDeltas[i]||0);
  const incl = new Map(), self = new Map();
  for (const [id, tt] of Object.entries(dt)) { let cur = Number(id); const seen = new Set(); const k0 = byId.get(cur).callFrame; self.set(k0.functionName+':'+k0.lineNumber, (self.get(k0.functionName+':'+k0.lineNumber)||0)+tt);
    while (cur != null) { const cf = byId.get(cur).callFrame; const k = cf.functionName + ':' + cf.lineNumber; if (!seen.has(k)) { incl.set(k, (incl.get(k)||0)+tt); seen.add(k);} cur = parent.get(cur);} }
  console.log('--incl'); [...incl].sort((a,b)=>b[1]-a[1]).slice(0,30).forEach(([k,tt])=>console.log((tt/1000|0)+'ms', k));
  console.log('--self'); [...self].sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,tt])=>console.log((tt/1000|0)+'ms', k));
  await b.close();
})();
