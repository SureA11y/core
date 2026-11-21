const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await b.newPage({ viewport: { width: 400, height: 100 } });
 async function img(s) { await p.setContent(`<!doctype html><span id=x style="${s}">terms of service</span>`); return p.locator('#x').screenshot(); }
 const a = await img('font-weight:400'), c = await img('font-weight:500'), d = await img('font-weight:600');
 console.log('400 vs 500 identical:', a.equals(c), '400 vs 600 identical:', a.equals(d));
 const e = await img('text-decoration:none'), f = await img('text-decoration:underline;text-decoration-thickness:0px');
 console.log('no underline vs thickness 0 identical:', e.equals(f));
 const g = await img('text-decoration:none'), h = await img('text-decoration:none;box-shadow:0 1px 0 transparent');
 console.log('box-shadow transparent identical:', g.equals(h));
 console.log(await p.evaluate(() => getComputedStyle(document.body).fontFamily));
 await b.close();
})();
