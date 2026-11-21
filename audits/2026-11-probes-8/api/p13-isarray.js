const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main><aside><img src="b"></aside></body></html>';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const broken of [false, true]) {
    const page = await browser.newPage();
    const logs = []; page.on('console', m => logs.push(m.text().slice(0, 160)));
    await page.setContent(html);
    await page.addScriptTag({ content: bundle });
    const out = await page.evaluate(async (broken) => {
      const ia = Array.isArray;
      if (broken) Array.isArray = () => false;
      try {
        const r = window.a11ycore.runa11yCoreInPage(null, null, { excludeSelectors: ['aside'], profile: ['wcag22-aa'] }, null); r.checksResults = r.checksResults.filter(c => c.ruleId === 'img-alt-present');
        return { n: r.checksResults.length, img: r.checksResults.filter(c => c.ruleId === 'img-alt-present').map(c => c.outcome + ':' + c.occurrences.length), prof: r.engine.profiles };
      } catch (e) { return 'THROW ' + e.code + ' ' + e.message.slice(0, 200); } finally { Array.isArray = ia; }
    }, broken);
    console.log('broken=' + broken, JSON.stringify(out), '\n   logs:', logs.join(' || ').slice(0, 600));
    await page.close();
  }
  await browser.close();
})();
