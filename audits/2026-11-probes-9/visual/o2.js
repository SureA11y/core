const h = require('./h');
(async () => {
  for (const css of [':root{--r:90deg} @media (orientation: landscape){ body{transform:rotate(var(--r))} }',
                     '@media (orientation: landscape){ body{--r:90deg; transform:rotate(var(--r))} }',
                     '@media (orientation: landscape){ body{transform:rotate(calc(45deg * 2))} }',
                     '@media (orientation: landscape){ body{transform:rotate(calc(1turn / 4))} }',
                     '@property --a{syntax:"<angle>";inherits:false;initial-value:0deg} @media (orientation: landscape){ body{--a:90deg; rotate:var(--a)} }']) {
    const page = await h.open(`<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main><h1>Title</h1><p>${'Lots of page content here. '.repeat(20)}</p></main></body></html>`);
    const tr = await page.evaluate(() => [getComputedStyle(document.body).transform, getComputedStyle(document.body).rotate]);
    const r = await h.scan(page, ['css-orientation-lock']);
    console.log(css, '\n   computed', tr, '->', r[0].outcome, r[0].occ.map(o => o.code).join());
    await page.context().close();
  }
  await h.close();
})();
