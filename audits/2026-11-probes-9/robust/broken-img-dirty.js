'use strict';
// No engine: which read on a page of broken images makes the next layout read
// expensive? Loops over all text nodes and does op X then reads scrollX.
const { serve, launch } = require('./lib');
const mk = (n, src) => `<!doctype html><html lang=en><title>p</title><main>${Array.from({ length: n }, (_, i) => `<div><img ${src(i)} alt="P ${i}"> t${i}</div>`).join('')}</main>`;
(async () => {
  const pages = {};
  for (const n of [4000, 8000]) {
    pages['/broken' + n] = { body: mk(n, (i) => `src="/i/${i}.png"`) };
    pages['/ok' + n] = { body: mk(n, () => 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"') };
  }
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const page = await context.newPage();
    await page.goto(s.base + p);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const texts = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) texts.push(t);
      const imgs = [...document.images];
      const time = (f) => { const t = performance.now(); f(); return Math.round(performance.now() - t); };
      const out = {};
      out.scrollXonly = time(() => { for (const t of texts) void scrollX; });
      out.gcsImgThenScroll = time(() => { for (const im of imgs) { void getComputedStyle(im).position; void scrollX; } });
      out.checkVisImgThenScroll = time(() => { for (const im of imgs) { im.checkVisibility({ opacityProperty: true, visibilityProperty: true }); void scrollX; } });
      out.rangeRectsThenScroll = time(() => { for (const t of texts) { const r = document.createRange(); r.selectNodeContents(t); r.getClientRects(); void scrollX; } });
      out.bcrImgThenScroll = time(() => { for (const im of imgs) { im.getBoundingClientRect(); void scrollX; } });
      out.offsetImgThenScroll = time(() => { for (const im of imgs) { void im.offsetWidth; void scrollX; } });
      out.completeImg = time(() => { for (const im of imgs) { void im.complete; void im.naturalWidth; void scrollX; } });
      return out;
    });
    console.log(p.padEnd(12), JSON.stringify(r));
    await page.close();
  }
  await browser.close();
  s.close();
})();
