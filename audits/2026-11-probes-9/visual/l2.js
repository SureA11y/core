const h = require('./h');
const all = require('./l1.js');
const names = ['baseline color only close', 'underline color = bg', 'border-bottom bg color', 'outline transparent', 'bg rgba tiny alpha', 'before content space', 'svg inside hidden'];
(async () => {
  let base;
  for (const n of names) {
    const html = all.find(c => c[0] === n)[1][0];
    const page = await h.open(html);
    const clip = await page.evaluate(() => { const r = document.getElementById('para').getBoundingClientRect(); return { x: r.x, y: r.y - 4, width: r.width, height: r.height + 8 }; });
    const shot = await page.screenshot({ clip });
    if (!base) base = shot;
    console.log(n.padEnd(30), 'identical to color-only baseline:', shot.equals(base), JSON.stringify((await h.pixels(page, clip)).slice(0, 3)));
    await page.context().close();
  }
  await h.close();
})();
