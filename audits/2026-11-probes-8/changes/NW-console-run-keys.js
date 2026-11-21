// console run(): which keys warn, and does the scan warn about the same key a second time?
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'warning') logs.push(m.text()); });
  await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><img src="a.png"></main></body></html>');
  await page.evaluate(fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8'));
  for (const opts of [{ foo: 1 }, { lcoale: 'fr' }, { report: {} }, { probes: {} }, { 'rules': { 'img-alt-present': { x: 1 } } }]) {
    logs.length = 0;
    const r = await page.evaluate(async (o) => { try { const x = await window.a11ycore.run(Object.assign({ runOnly: ['img-alt-present'] }, o)); return 'ok ' + x.checksResults.length; } catch (e) { return 'ERR ' + e.message.slice(0, 80); } }, opts);
    await new Promise(r => setTimeout(r, 100));
    console.log(JSON.stringify(opts), r, '\n   warnings:', logs.length, logs.map(l => l.slice(0, 110)).join('\n   '));
  }
  await b.close();
})();
