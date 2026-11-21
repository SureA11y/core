const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await b.newPage();
 await p.setContent(`<!doctype html><div id=d style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to newsletter</div><div id=e style="width:220px;height:20px;clip-path:inset(0);line-height:18px;font-size:16px">Subscribe to newsletter</div>`);
 const f = () => [...document.querySelectorAll('div')].map(d => { const r = document.createRange(); r.selectNodeContents(d); return { rects: [...r.getClientRects()].map(x => [Math.round(x.left), Math.round(x.top), Math.round(x.width), Math.round(x.height)]), sh: d.scrollHeight }; });
 console.log(JSON.stringify(await p.evaluate(f)));
 await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
 console.log(JSON.stringify(await p.evaluate(f)));
 await p.screenshot({ path: '/tmp/surea11y-audit/r8/visual/d4.png', clip: { x: 0, y: 0, width: 300, height: 80 } });
 await b.close();
})();
