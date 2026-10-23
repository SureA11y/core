// Does a highlight box land on its element when <html> is transformed, positioned with a margin, zoomed, RTL-scrolled, or the element is fixed?
import { launch, open } from './h.mjs';
const cases = {
  plain: '',
  htmlTransform: 'html{transform:translateX(100px)}',
  htmlTransformScale: 'html{transform:scale(0.5);transform-origin:0 0}',
  htmlRelativeMargin: 'html{position:relative;margin-top:60px}',
  htmlZoom: 'html{zoom:1.5}',
  bodyZoom: 'body{zoom:2}',
  htmlBorder: 'html{border:20px solid #000; position:relative}',
  rtlScrolled: 'html{direction:rtl} body{width:3000px}',
  fixedEl: '#t{position:fixed;top:100px;left:50px} body{height:3000px}'
};
const b = await launch();
for (const [k, css] of Object.entries(cases)) {
  const html = `<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main><p>x</p><img id=t src="data:," style="width:40px;height:40px;display:block;margin:30px 200px"></main></body></html>`;
  const { page, ctx } = await open(b, html);
  const r = await page.evaluate(async (k) => {
    if (k === 'rtlScrolled') window.scrollTo(-500, 0);
    if (k === 'fixedEl') window.scrollTo(0, 400);
    const res = await a11ycore.run({ runOnly: ['img-alt-present'] });
    a11ycore.highlight(res);
    const box = document.querySelector('[data-surea11y-highlights]').shadowRoot.querySelector('.box');
    const a = box.getBoundingClientRect(), e = document.getElementById('t').getBoundingClientRect();
    return { dx: Math.round(a.left - e.left), dy: Math.round(a.top - e.top), dw: Math.round(a.width - e.width), sx: scrollX };
  }, k);
  console.log(k.padEnd(20), JSON.stringify(r));
  await ctx.close();
}
await b.close();
