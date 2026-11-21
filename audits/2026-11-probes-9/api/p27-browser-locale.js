const { chromium } = require('/home/user/core-r9/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent('<html><body><img src="x.png"><button></button></body></html>');
  await page.addScriptTag({ path: '/home/user/core-r9/surea11y.browser.js' });
  const run = (eo) => page.evaluate((eo) => { const r = window.a11ycore.runa11yCoreInPage(null, null, eo, ['img-alt-present','button-name-present']); const i = r.checksResults.find(c=>c.ruleId==='img-alt-present'), b = r.checksResults.find(c=>c.ruleId==='button-name-present'); return [JSON.stringify(r.engine.locale), i.title, i.occurrences[0].summary, b.title].join(' | '); }, eo);
  console.log('no side, de:', await run({ locale: 'de' }));
  console.log('no side, de + messages.de one key:', await run({ locale: 'de', messages: { de: { img_altPresent_title: 'Eigener' } } }));
  await page.addScriptTag({ path: '/home/user/core-r9/surea11y.i18n.de.js' });
  console.log('side, de:', await run({ locale: 'de' }));
  console.log('side, DE:', await run({ locale: 'DE' }));
  console.log('side, de-AT:', await run({ locale: 'de-AT' }));
  console.log('side, de + messages.de one key:', await run({ locale: 'de', messages: { de: { img_altPresent_title: 'Eigener' } } }));
  console.log('side, de-AT + messages.de-AT one key:', await run({ locale: 'de-AT', messages: { 'de-AT': { img_altPresent_title: 'AT' } } }));
  await browser.close();
})();
