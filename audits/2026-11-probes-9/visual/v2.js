const h = require('./h');
(async () => {
  for (const s of ['position:absolute;width:1px;height:1px;overflow:hidden;white-space:nowrap', 'position:absolute;width:1px;height:1px;overflow:hidden', 'position:absolute;width:1px;height:1px;overflow:hidden;margin:-1px', 'position:absolute;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px)']) {
    const html = `<div style="background:#fff;padding:20px"><span id=t style="color:#000;font:16px Arial;${s}">Hidden text that is long</span></div>`;
    const page = await h.open(html);
    const clip = { x: 0, y: 0, width: 300, height: 60 };
    const px = await h.pixels(page, clip);
    const r = await h.scan(page, ['contrast-minimum', 'contrast-computable']);
    console.log(s, '\n   drawn:', JSON.stringify(px), '\n   ', r.map(c => c.rule + ':' + c.outcome + ' ' + c.occ.map(o => o.code + ' ' + (o.d.colors ? o.d.colors.foregroundHex + '/' + o.d.colors.backgroundHex : '')).join()).join(' | '));
    await page.context().close();
  }
  await h.close();
})();
