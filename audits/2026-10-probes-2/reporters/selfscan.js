const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    await p.goto('file://' + process.argv[2]);
    await p.evaluate(() => { document.querySelector('details').open = true; });
    await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
    const r = await p.evaluate(async () => window.a11ycore.runa11yCoreInPage(null, null, {}));
    console.log('==', scheme);
    for (const c of r.checksResults) if (c.outcome === 'fail' || (c.outcome === 'cantTell' && c.type === 'automatic')) {
      console.log(c.ruleId, c.outcome, c.occurrences.length);
      { const g = {}; for (const o of c.occurrences) { const m = (o.summary||"").match(/of ([\d.]+):1 \(foreground: (#\w+), background: (#\w+)/); const k = m ? m.slice(1).join(" ") + " " + o.selector.replace(/:nth-of-type\(\d+\)/g,"").split(" > ").slice(-2).join(">") : o.summary; g[k]=(g[k]||0)+1; } for (const [k,v] of Object.entries(g)) console.log("   ", v, k); }
    }
    await p.close();
  }
  await b.close();
})();
