const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(process.argv[2] || '<!doctype html><html lang="en"><head><title>Marquee</title></head><body><main><h1>News</h1><marquee>Breaking news ticker text</marquee></main></body></html>');
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const res = [];
  for (let i = 0; i < 12; i++) { res.push(await p.evaluate(() => { if (window.__full) a11ycore.runa11yCoreInPage(location.href, null, {}, null); const c = a11ycore.runa11yCoreInPage(location.href, null, {}, ['text-spacing-content-loss']).checksResults[0]; return c.outcome + (c.occurrences[0] ? ':' + c.occurrences[0].summary.slice(0, 90) : ''); })); await p.waitForTimeout(137); }
  console.log(res.join('\n'));
  await b.close();
})();
