// Round 6: a visibility:hidden panel partly past the edge, at 320px, on main.
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 320, height: 640 } });
  for (const [label, css] of [
    ['visibility:hidden panel', '#menu{position:absolute;top:0;left:200px;width:280px;visibility:hidden}'],
    ['shown panel', '#menu{position:absolute;top:0;left:200px;width:280px}']
  ]) {
    await p.setContent(`<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="width=device-width"><style>body{margin:0;overflow-x:hidden} ${css}</style></head><body><main><h1>Page</h1><nav id="menu"><a href="/a">Home</a> <a href="/b">About</a></nav></main></body></html>`);
    await p.addScriptTag({ content: bundle });
    const r = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null));
    const c = r.checksResults.find((x) => x.ruleId === 'reflow-horizontal-scroll');
    console.log(label.padEnd(24), c.outcome, c.occurrences.map((o) => o.data.details.reasonCode).join(','));
  }
  await b.close();
})();
