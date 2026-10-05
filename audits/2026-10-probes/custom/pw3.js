const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><div id="a" onclick="x()">a</div></main></body></html>`);
  await page.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js','utf8') });
  const src = "(ctx)=>{ const o={summary:'x', __node: ctx.document.querySelector('#a')}; o.me=o; return {outcome:'fail',occurrences:[o]}; }";
  console.log(await page.evaluate((src) => { try { const r = window.a11ycore.runa11yCoreInPage(location.href, null, { customRules:[{id:"z",meta:{},runInPage:src}] }, ["z"]); return "in-page ok; outcome=" + r.checksResults[0].outcome; } catch (e) { return "in-page THROW " + e.message + " | " + (e.stack||"").split("\n").slice(0,4).join(" / "); } }, src));
  await browser.close();
})();
