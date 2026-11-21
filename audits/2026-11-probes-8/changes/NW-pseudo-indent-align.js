// contrast: ::before text with display:block and text-indent:-9999px, but text-align:right/center/end, is drawn on screen.
// The new image-replacement shortcut leaves it out of contrast whatever the alignment. Pixel check + engine, old vs new.
const { run, close } = require('./h');
const R = ['contrast-minimum'];
(async () => {
  for (const align of ['left', 'right', 'center', 'end']) {
    const html = `<html lang="en"><head><title>t</title><style>.x::before{content:"Pale words here";display:block;text-indent:-9999px;text-align:${align};color:#bbb;background:#fff;font-size:16px}</style></head><body style="margin:0;background:#fff"><main><h1 style="color:#000">T</h1><div class="x" style="width:300px"></div></main></body></html>`;
    const out = {};
    for (const core of ['old', 'new']) {
      const r = await run(html, R, { core, after: (p) => p.evaluate(() => { const el = document.querySelector('.x'); const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; }) });
      out[core] = r.res[0].outcome + ' ' + r.res[0].occ.length;
      out.box = r.extra;
    }
    // painted pixels: any non-white in the box?
    const { chromium } = require('/home/user/core/node_modules/playwright');
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
    await p.setContent('<!doctype html>' + html);
    const box = await p.evaluate(() => { const r = document.querySelector('.x').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.max(1, r.height) }; });
    const png = await p.screenshot({ clip: box });
    await b.close();
    const sharp = null;
    console.log(('text-align:' + align).padEnd(18), 'old', out.old, '| new', out.new, '| box', JSON.stringify(out.box), '| screenshot bytes', png.length, '(white box ~ small)');
  }
  await close();
})();
