const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const vals = ['', ' ', '-0', '+1', ' 1', ' 1', '　1', '1.9', '2abc', '0x1', '1e3', '١', '２', '2147483647', '2147483648', '99999999999', '-2147483649', '-1x', '- 1', '+-1'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(vals.map((v, i) => `<div id=d${i}>x</div>`).join(''));
  const chrome = await p.evaluate((vals) => vals.map((v, i) => { const d = document.getElementById('d' + i); d.setAttribute('tabindex', v); return d.tabIndex; }), vals);
  await b.close();
  for (const root of ['/home/user/core-r11','/home/user/r11-review']) {
    const { JSDOM } = require('/home/user/r11-review/node_modules/jsdom');
    const { createDomHelpers } = require(root + '/src/core/dom-helpers.js');
    const dm = new JSDOM('<div></div>'); const h = createDomHelpers({ document: dm.window.document, window: dm.window, root: [dm.window.document] });
    console.log(root.padEnd(22), vals.map((v) => h.parseHtmlInteger ? h.parseHtmlInteger(v) : 'n/a').join(' | '));
  }
  console.log('chrome tabIndex'.padEnd(22), chrome.join(' | '));
  console.log('values'.padEnd(22), vals.map(JSON.stringify).join(' | '));
})();
