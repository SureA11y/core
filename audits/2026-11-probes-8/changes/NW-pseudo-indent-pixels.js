// Ground truth for NW-pseudo-indent-align.js: count non-white pixels in the ::before box per text-align
const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const align of ['left', 'right', 'center', 'end']) {
    const html = `<!doctype html><html lang="en"><head><style>.x::before{content:"Pale words here";display:block;text-indent:-9999px;text-align:${align};color:#bbb;background:#fff;font-size:16px}</style></head><body style="margin:0;background:#fff"><div class="x" style="width:300px"></div></body></html>`;
    const p = await b.newPage({ viewport: { width: 400, height: 100 } });
    await p.setContent(html);
    const png = (await p.screenshot({ clip: { x: 0, y: 0, width: 300, height: 18 } })).toString('base64');
    const n = await p.evaluate(async (src) => { const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 250) k++; return k; }, png);
    console.log('text-align:' + align, 'non-white pixels', n);
    await p.close();
  }
  await b.close();
})();
