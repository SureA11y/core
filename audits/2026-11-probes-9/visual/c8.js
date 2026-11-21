const h = require('./h');
const html = `<style>body{margin:0;background:#fff;font:16px Arial}</style><header style="position:fixed;top:0;left:0;right:0;height:50px"><p id=t style="margin:0;padding:15px;color:#f5f5f5">Brand navigation</p></header><div style="height:400px;background:#123"></div><div style="height:2000px">content</div>`;
(async () => {
  for (const y of [0, 800]) {
    const page = await h.open(html);
    await page.evaluate(y => scrollTo(0, y), y);
    const r = await h.scan(page, ['contrast-minimum', 'contrast-computable']);
    const px = await h.pixels(page, { x: 0, y: 0, width: 200, height: 50 });
    console.log('scroll', y, r.map(c => c.rule + ':' + c.outcome + ' ' + c.occ.filter(o => o.code !== 'ALL_TEXT_COMPUTABLE').map(o => o.code + ' ' + (o.d.colors ? o.d.colors.foregroundHex + '/' + o.d.colors.backgroundHex : '') + ' ' + o.msg.slice(0, 150)).join()).join(' | '), 'drawn', JSON.stringify(px.slice(0, 2)));
    await page.context().close();
  }
  await h.close();
})();
