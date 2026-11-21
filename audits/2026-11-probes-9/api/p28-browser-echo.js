const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent('<html lang="en"><title>t</title><body><main><h1>x</h1><img src="x.png"></main></body></html>');
  await page.addScriptTag({ path: '/home/user/core-r9/surea11y.browser.js' });
  const size = () => page.evaluate(() => { const r = window.a11ycore.runa11yCoreInPage(null, null, { locale: 'de' }, null); return [JSON.stringify(r).length, Object.keys(r.checksResults[0].engineOptions).join(','), 'messages' in r.checksResults[0].engineOptions]; });
  console.log('before side file', await size());
  await page.addScriptTag({ path: '/home/user/core-r9/surea11y.i18n.de.js' });
  console.log('after side file', await size());
  await browser.close();
})();
