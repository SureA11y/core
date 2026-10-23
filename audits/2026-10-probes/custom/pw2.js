const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><div id="a" onclick="x()">a</div></main></body></html>`);
  await page.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js','utf8') });
  for (const [k, src] of Object.entries({
    circular: "(ctx)=>{ const o={summary:'x', __node: ctx.document.querySelector('#a')}; o.me=o; return {outcome:'fail',occurrences:[o]}; }",
    nodeInData: "(ctx)=>({outcome:'fail',occurrences:[{__node: ctx.document.querySelector('#a'), data:{el: ctx.document.querySelector('#a')}}]})",
    nodeOnResult: "(ctx)=>({outcome:'fail',occurrences:[], evidence: ctx.document.body})",
    windowInRes: "(ctx)=>({outcome:'pass',occurrences:[], w: ctx.window})",
  })) {
    try {
      const r = await page.evaluate((src) => window.a11ycore.runa11yCoreInPage(location.href, null, { customRules:[{id:'z',meta:{},runInPage:src}] }, ['z']), src);
      const c = r.checksResults.find(x=>x.ruleId==='z'); console.log(k, 'OK', JSON.stringify(c.occurrences[0] || c.evidence || c.w || null).slice(0,200));
      try { JSON.stringify(r); console.log('  JSON ok'); } catch (e) { console.log('  JSON.stringify THROW', e.message.split('\n')[0]); }
    } catch (e) { console.log(k, 'ERR', e.message.split('\n')[0].slice(0,200)); }
  }
  await browser.close();
})();
