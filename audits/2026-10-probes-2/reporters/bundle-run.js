const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage();
  await p.setContent(`<!doctype html><html lang="de"><head><title>T</title></head><body><img src="a.png"><button></button><input type="text"><p style="color:#777;background:#888">low</p></body></html>`);
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  for (const loc of process.argv.slice(2)) await p.addScriptTag({ path: `/home/user/core/surea11y.i18n.${loc}.js` });
  const keys = await p.evaluate(() => Object.keys(window.a11ycore));
  console.log(keys);
  for (const loc of ['de', 'ja', 'fr-CA', 'xx']) {
    const r = await p.evaluate(async (loc) => { const fn = window.a11ycore.runa11yCoreInPage || window.a11ycore.run; const r = await fn(null, null, { locale: loc, timestamp: '2026-01-01T00:00:00Z' }); return r; }, loc);
    fs.writeFileSync(`bres.${loc}.json`, JSON.stringify(r));
    const f = r.checksResults.find(c => c.outcome === 'fail');
    console.log(loc, JSON.stringify(r.engine.locale), f.title, '|', f.occurrences[0].summary, '|', r.rulesResults[0] && r.rulesResults[0].title, '|', JSON.stringify(f.meta.normativeMappings[0]));
  }
  await b.close();
})();
