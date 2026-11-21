const { cases, close } = require('./multi');
const { shot } = require('./h');
const R = ['reflow-horizontal-scroll'];
const vp = '<meta name="viewport" content="width=device-width,initial-scale=1">';
const H = vp + `<div dir="rtl"><p style="width:500px">هذا نص طويل جدا يمتد إلى ما بعد حافة الشاشة اليسرى ولا يمكن الوصول إليه بالتمرير أبدا</p></div>`;
const H2 = vp + `<div dir="rtl"><table><tr><td style="white-space:nowrap">هذا نص طويل جدا يمتد إلى ما بعد حافة الشاشة اليسرى ولا يمكن الوصول إليه</td></tr></table></div>`;
(async () => {
await cases([['rtl block in ltr page', H], ['rtl nowrap cell in ltr page', H2]], R, { viewport: { width: 320, height: 640 } });
for (const h of [H, H2]) { const s = await shot(h, { viewport: { width: 320, height: 640 }, eval: () => { const e = document.querySelector('p,td'); const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); window.scrollTo(-1000, 0); return { textLeft: b.left, textRight: b.right, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sx: scrollX }; } }); console.log(s.ev); }
await close();
})();
