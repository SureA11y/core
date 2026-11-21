const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type()==='warning' || m.type()==='error') console.log('  console.'+m.type()+':', m.text().slice(0,200)); });
  await page.setContent('<html lang="en"><title>t</title><body><main><h1>x</h1><img src="x.png"><button></button><a href="#">click here</a></main></body></html>');
  await page.addScriptTag({ path: '/home/user/core-r9/surea11y.browser.js' });
  const out = await page.evaluate(async () => {
    const res = {};
    const full = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
    const compact = window.a11ycore.runa11yCoreInPage(null, null, { output: { detail: 'findings' } }, null);
    const t1 = window.a11ycore.table(full), t2 = window.a11ycore.table(compact);
    res.tableFull = Array.isArray(t1) ? t1.length : typeof t1; res.tableCompact = Array.isArray(t2) ? t2.length : typeof t2;
    const h1 = window.a11ycore.highlight(full); res.hl = typeof h1 === 'number' ? h1 : (h1 && h1.length) ;
    res.boxes = document.querySelectorAll('[data-surea11y-highlight], [data-a11ycore-highlight]').length;
    const h2 = window.a11ycore.highlight(compact); res.hl2 = typeof h2 === 'number' ? h2 : (h2 && h2.length);
    try { const r = await window.a11ycore.run({ locale: 'de' }); res.run = r.engine.locale.resolved; } catch (e) { res.run = 'throws ' + e.message; }
    try { const r = await window.a11ycore.run({ runOnly: ['img-alt-present'] }); res.runOnly = r.checksResults.length; } catch (e) { res.runOnly = 'throws ' + e.message; }
    try { const r = await window.a11ycore.run({ contextSelector: 'main' }); res.ctx = JSON.stringify(r.contextMatch); } catch (e) { res.ctx = 'throws ' + e.message; }
    return res;
  });
  console.log(JSON.stringify(out));
  await browser.close();
})();
