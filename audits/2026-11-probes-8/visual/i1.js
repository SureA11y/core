const { cases, close } = require('./multi');
const R = ['scrollable-region-focusable'];
(async () => {
await cases([
 ['scroller no focusable', `<div style="height:60px;overflow:auto"><p>a</p><p>b</p><p>c</p><p>d</p></div>`],
 ['scroller not overflowing', `<div style="height:200px;overflow:auto"><p>a</p></div>`],
 ['scroller subpixel overflow', `<div style="height:49.5px;overflow:auto"><div style="height:50px">a</div></div>`],
 ['overflow hidden scroller', `<div style="height:60px;overflow:hidden"><p>a</p><p>b</p><p>c</p><p>d</p></div>`],
 ['scroller with tabindex', `<div tabindex=0 style="height:60px;overflow:auto"><p>a</p><p>b</p><p>c</p><p>d</p></div>`],
], R);
await close();
const { chromium } = require('/home/user/core/node_modules/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage(); await p.setContent(`<!doctype html><div id=s style="height:60px;overflow:auto"><p>a</p><p>b</p><p>c</p><p>d</p></div>`);
await p.keyboard.press('Tab'); console.log('Chromium tab goes to:', await p.evaluate(() => document.activeElement.id || document.activeElement.tagName), await b.version());
await b.close();
})();
