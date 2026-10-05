const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.route('**/slow.png', async (r) => { await new Promise(s => setTimeout(s, 3000)); r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') }); });
  await p.route('**/slow.woff2', async (r) => { await new Promise(s => setTimeout(s, 3000)); r.fulfill({ status: 404, body: '' }); });
  await p.route('https://ex.test/', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang=en><head><title>t</title><meta name=viewport content="width=device-width"><style>@font-face{font-family:F;src:url(/slow.woff2)}p{font-family:F}
  @keyframes fade{from{opacity:0}to{opacity:1}} .f{animation:fade 5s} @keyframes m{from{transform:translateX(0)}to{transform:translateX(-500px)}} .m{animation:m 3s linear infinite} .t{transition:color 10s}</style></head><body style="background:#fff"><p class=f style="color:#000">Fading text</p><p class=m>Marquee</p><img src="/slow.png" alt="x"><img src="/slow.png" loading=lazy alt="y"></body></html>` }));
  p.goto('https://ex.test/', { waitUntil: 'commit' });
  await p.waitForTimeout(300);
  await p.addScriptTag({ content: BUNDLE });
  const res = await p.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['contrast-minimum'] } }, null); return { env: r.engine.environment, c: r.checksResults[0].outcome }; });
  console.log('early', JSON.stringify(res));
  const ready = await p.evaluate(() => window.a11ycore.waitForPageReady({ timeoutMs: 6000 }));
  console.log('ready', JSON.stringify(ready));
  const res2 = await p.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['contrast-minimum'] } }, null); return { env: r.engine.environment, m: r.checksResults[0].margin && r.checksResults[0].margin.value }; });
  console.log('after', JSON.stringify(res2));
  // animations restored?
  console.log('anim state', await p.evaluate(() => document.getAnimations().map(a => [a.playState, Math.round(a.currentTime)])));
  await b.close();
})();
