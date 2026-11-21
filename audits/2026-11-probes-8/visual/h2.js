const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await b.newPage({ viewport: { width: 800, height: 600 } });
 await p.setContent(`<!doctype html><style>body{overflow-x:hidden}</style><nav style="position:absolute;left:100%;top:0;width:250px"><a href="#">Menu link</a></nav><p>page</p>`);
 await p.keyboard.press('Tab');
 console.log(await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { tag: a.tagName, left: r.left, sx: scrollX, vis: document.elementFromPoint(r.left+2, r.top+2) === a }; }));
 await b.close();
})();
