const h = require('./h');
const cases = require('./hf1.js').filter(c => /ancestor opacity 0$|filter opacity|own scale\(0\)|z-index/.test(c[0]));
(async () => {
  for (const [n, [html]] of cases) {
    const page = await h.open(html);
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { id: a.id, r: [r.x, r.y, r.width, r.height].map(Math.round) }; });
    const nav = await page.evaluate(() => { const r = document.querySelector('.menu').getBoundingClientRect(); return { x: 0, y: Math.max(0, r.y - 10), width: 600, height: 60 }; });
    console.log(n, JSON.stringify(info), 'pixels around nav while focused:', JSON.stringify(await h.pixels(page, nav)));
    await page.context().close();
  }
  await h.close();
})();
