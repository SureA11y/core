const h = require('./h');
const cases = require('./f1.js').filter(c => /baseline|transformed|sticky/.test(c[0]));
cases.push(['sticky header', cases[0][1].replace('position:fixed;top:0;left:0;right:0', 'position:sticky;top:0')]);
cases.push(['sticky footer', cases[0][1].replace('<header id=t style="position:fixed;top:0;left:0;right:0;height:60px', '<footer id=t style="position:fixed;bottom:0;left:0;right:0;height:60px').replace('</header>', '</footer>')]);
(async () => {
  for (const [n, html] of cases) {
    for (const y of [0, 800, 99999]) {
      const page = await h.open(html);
      await page.evaluate(y => scrollTo(0, y), y);
      const r = await h.scan(page, ['focus-not-obscured-minimum']);
      const sy = await page.evaluate(() => scrollY);
      console.log(n, 'scroll', y, '->', r[0].outcome, r[0].occ.map(o => o.code + ' ' + (o.d.metrics ? JSON.stringify(o.d.metrics) : '')).join(' ; '), 'scrollY after', sy);
      await page.context().close();
    }
  }
  await h.close();
})();
