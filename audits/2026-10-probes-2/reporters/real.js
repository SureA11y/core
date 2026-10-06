const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('file://' + __dirname + '/real.html');
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  await p.addScriptTag({ path: '/home/user/core/surea11y.i18n.de.js' });
  for (const loc of ['en', 'de']) {
    const r = await p.evaluate(async (loc) => window.a11ycore.runa11yCoreInPage(null, null, { locale: loc, timestamp: '2026-01-01T00:00:00Z' }), loc);
    fs.writeFileSync(`result.real-${loc}.json`, JSON.stringify(r));
    console.log(loc, r.url, JSON.stringify(r.engine.environment), r.checksResults.filter(c => c.margin).map(c => c.ruleId + ':' + JSON.stringify(c.margin)).join('\n'));
  }
  await b.close();
})();
