const h = require('./h');
const cases = require('./tsp2.js').filter(c => /line-clamp 2 of/.test(c[0]));
(async () => {
  for (const [n, [html]] of cases) {
    const page = await h.open(html);
    const before = await page.evaluate(() => { const e = document.getElementById('t'); return { h: e.getBoundingClientRect().height, sh: e.scrollHeight }; });
    await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
    const after = await page.evaluate(() => { const e = document.getElementById('t'); return { h: e.getBoundingClientRect().height, sh: e.scrollHeight }; });
    await page.evaluate(() => document.querySelector('style:last-of-type').remove());
    const r = await h.scan(page, ['text-spacing-content-loss']);
    console.log(n, 'before', before, 'after', after);
    for (const o of r[0].occ) console.log(o.msg, JSON.stringify(o.d.lines || o.d.metrics));
    await page.context().close();
  }
  await h.close();
})();
