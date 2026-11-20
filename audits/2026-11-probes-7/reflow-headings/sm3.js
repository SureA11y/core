const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const n = 20000; const html = '<!doctype html><body><div style="overflow-x:auto">' + Array.from({length:n},(_,i)=>`<div style="width:400px">Item ${i} <input></div>`).join('') + '</div></body>';
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 320, height: 640 } });
  let t = Date.now(); await page.setContent(html); console.log('setContent', Date.now()-t);
  t = Date.now(); await page.addScriptTag({ content: BUNDLE }); console.log('addScript', Date.now()-t);
  t = Date.now(); await page.evaluate(() => 1); console.log('noop', Date.now()-t);
  t = Date.now(); await page.evaluate(() => document.body.getBoundingClientRect().width); console.log('layout', Date.now()-t);
  t = Date.now(); const inner = await page.evaluate(async () => { const t0 = performance.now(); await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null); return performance.now()-t0; }); console.log('run', Date.now()-t, 'inner', Math.round(inner));
  t = Date.now(); await page.evaluate(() => 1); console.log('noop', Date.now()-t);
  t = Date.now(); const inner2 = await page.evaluate(async () => { const t0 = performance.now(); await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null); return performance.now()-t0; }); console.log('run2', Date.now()-t, 'inner', Math.round(inner2));
  await b.close();
})();
