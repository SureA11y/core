const h = require('./h');
const cases = require('./f4.js').filter(c => /::before|box-shadow inset/.test(c[0]));
(async () => {
  for (const [n, html] of cases) {
    const page = await h.open(html);
    await page.evaluate(() => scrollTo(0, 400)); // l10 at doc y=400 -> viewport y=0..
    // Tab to the first link that's in view? focus l10 programmatically like keyboard (no scroll since in view)
    const info = await page.evaluate(() => { const a = document.getElementById('l10'); a.focus(); const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + 2, r.y + r.height / 2); return { scrollY, r: [r.x, r.y, r.width, r.height].map(Math.round), hit: hit.id || hit.tagName }; });
    const px = await h.pixels(page, { x: 0, y: 0, width: 200, height: 60 });
    console.log(n, JSON.stringify(info), 'pixels in header strip:', JSON.stringify(px.slice(0, 3)));
    await page.context().close();
  }
  await h.close();
})();
