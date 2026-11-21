const h = require('./h');
const html = `<style>body{margin:0}.b{all:unset;display:inline-block;width:16px;height:16px;background:#ccc}</style>
<div style="height:640px">top</div><div id=row><button class=b aria-label=a></button><button class=b aria-label=b></button></div><div style="height:1500px"></div>
<div style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#333;color:#fff">Cookie banner</div>`;
(async () => {
  for (const y of [0, 300]) {
    const page = await h.open(html);
    await page.evaluate(y => scrollTo(0, y), y);
    const pos = await page.evaluate(() => document.getElementById('row').getBoundingClientRect().y);
    const r = await h.scan(page, ['target-size-minimum']);
    console.log('scrollY', y, 'row at viewport y', pos, '->', r[0].outcome, r[0].occ.map(o => o.code).join());
    await page.context().close();
  }
  await h.close();
})();
