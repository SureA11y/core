const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 320, height: 640 } });
  await p.setContent('<!doctype html><html lang="ar" dir="rtl"><head><style>body{margin:8px;font:16px/1.4 sans-serif} #p{position:relative;left:60px}</style></head><body><p id="p">نص طويل يبدأ بعد الحافة اليمنى للصفحة ويستمر</p></body></html>');
  console.log(await p.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('p').firstChild); const x = r.getBoundingClientRect(); return { left: x.left, right: x.right, w: x.width, cw: document.documentElement.clientWidth, sx: scrollX }; }));
  await b.close();
})();
