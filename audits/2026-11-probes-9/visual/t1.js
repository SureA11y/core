const h = require('./h');
(async () => {
  const page = await h.open('<p id=t style="color:#777;background:#fff;font-size:16px">Hello world text</p>');
  const k = await page.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum']); return JSON.stringify(r.checksResults[0], null, 1).slice(0, 3000); });
  console.log(k); await h.close();
})();
