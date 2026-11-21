const h = require('./h');
(async () => {
  const html = require('./tsp2.js').find(c => c[0] === 'line-clamp 2 of 3')[1][0];
  const page = await h.open(html);
  console.log(await page.evaluate(() => { const e = document.getElementById('t'); const r = document.createRange(); r.selectNodeContents(e); return { box: e.getBoundingClientRect().toJSON(), rects: [...r.getClientRects()].map(x => [x.x, x.y, x.width, x.height].map(Math.round).join(',')) }; }));
  console.log(await h.pixels(page, { x: 0, y: 40, width: 300, height: 25 }));
  await h.close();
})();
