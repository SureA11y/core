// strictOptions refuses excludeSelectors that "aren't valid CSS": does jsdom agree with Chromium?
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const sels = [':has(> img)', ':is(.a)', ':where(.a)', ':not(.a, .b)', ':nth-child(2 of .x)', ':focus-visible', ':dir(rtl)', ':popover-open', ':state(x)', ':host', '::part(x)', 'div::before', ':open', ':user-invalid', ':modal', ':read-write', ':placeholder-shown', ':lang("en")', ':has(:is(a))', '.a >> .b', '#1abc', 'svg|a', '*|div'];
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><img src=a.png></main></body></html>';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  await page.setContent(html);
  await page.evaluate(fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8'));
  for (const s of sels) {
    let j;
    try { runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'], engineOptions: { strictOptions: true, excludeSelectors: [s] } }); j = 'ok'; } catch (e) { j = 'THROW ' + (e.code || e.message.slice(0, 60)); }
    const c = await page.evaluate(async (s) => { try { await window.a11ycore.runa11yCoreInPage(null, null, { strictOptions: true, excludeSelectors: [s] }, ['img-alt-present']); return 'ok'; } catch (e) { return 'THROW ' + (e.code || e.message.slice(0,60)); } }, s);
    console.log((j === c ? '   ' : '!! ') + s.padEnd(22), 'jsdom:', j.padEnd(32), 'chromium:', c);
  }
  await b.close();
})();
