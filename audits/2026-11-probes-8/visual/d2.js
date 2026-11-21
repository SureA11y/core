const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs'); const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 for (const html of [
  `<div style="overflow:hidden;height:40px;width:140px;font-size:16px;line-height:18px">Words that will wrap under the spacing for sure here and more</div>`,
  `<div style="overflow:hidden;height:40px;width:140px;font-size:16px;line-height:18px"><p style="margin:0">Words that will wrap under the spacing for sure here and more</p></div>`,
  `<button style="width:120px;height:32px;overflow:hidden;font-size:16px;line-height:1.2">Subscribe to newsletter now</button>`,
  `<button style="width:220px;height:22px;overflow:hidden;font-size:16px;line-height:20px">Subscribe to newsletter</button>`,
  `<div style="display:grid;grid-template-rows:20px;overflow:hidden;height:20px;width:140px"><div>Words that will wrap under spacing</div></div>`,
  `<div style="overflow:hidden;height:20px;width:140px"><div>Words that will wrap under spacing</div></div>`,
  `<div style="overflow:hidden;height:20px;width:140px">Words that will wrap under spacing</div>`,
  `<p>hello</p>`,
 ]) {
  const p = await b.newPage(); await p.setContent('<!doctype html>' + html); await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['text-spacing-content-loss'] } }, null); const c = r.checksResults[0]; return { o: c.outcome, data: c.data, occ: (c.occurrences||[]).map(o => o.data && o.data.details) }; });
  console.log(html.slice(0, 80), '\n  ', JSON.stringify(r).slice(0, 600));
  await p.close();
 }
 await b.close();
})();
