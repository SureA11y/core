const { chromium } = require('/home/user/core/node_modules/playwright');
const core = require('/home/user/core/src/index.js');
const SRC = core.runa11yCoreInPage.toString();
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.setContent('<html lang="en"><head><title>t</title></head><body><main><div id="widget"></div></main></body></html>');
  await page.evaluate(() => { document.getElementById('widget').attachShadow({ mode: 'open' }).innerHTML = '<p style="color:#999;background:#fff">Shadow low contrast text</p><button></button>'; });
  for (const eo of [{}, { excludeSelectors: ['#widget'] }]) {
    const r = await page.evaluate(([src, eo]) => new Function('return (' + src + ')')()(location.href, null, eo, ['contrast-minimum', 'contrast-computable', 'button-name-present']), [SRC, eo]);
    console.log(JSON.stringify(eo), r.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length));
  }
  await browser.close();
})();
