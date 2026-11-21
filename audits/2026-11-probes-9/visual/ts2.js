const h = require('./h');
const cases = [
 ['cb 12', `<div style="margin:50px"><input type=checkbox aria-label=a style="width:12px;height:12px;margin:0"><input type=checkbox aria-label=b style="width:12px;height:12px;margin:0"></div>`],
 ['cb 8', `<div style="margin:50px"><input type=checkbox aria-label=a style="width:8px;height:8px;margin:0"><input type=checkbox aria-label=b style="width:8px;height:8px;margin:0"></div>`],
 ['cb default margin0', `<div style="margin:50px"><input type=checkbox aria-label=a style="margin:0"><input type=checkbox aria-label=b style="margin:0"></div>`],
 ['radio zoom .7', `<div style="margin:50px;zoom:.7"><input type=radio aria-label=a style="margin:0"><input type=radio aria-label=b style="margin:0"></div>`],
 ['select 8px', `<div style="margin:50px"><select aria-label=a style="font-size:8px"><option>x</select><select aria-label=b style="font-size:8px"><option>y</select></div>`],
 ['pseudo single', `<style>.x{position:relative}.x::before{content:"";position:absolute;inset:-10px}</style><div style="margin:50px"><button class=x style="all:unset;display:inline-block;position:relative;width:16px;height:16px;background:#ccc"></button><button style="all:unset;display:inline-block;width:24px;height:24px;margin-left:14px;background:#ccc">b</button></div>`],
];
(async () => {
  for (const [n, html] of cases) {
    const page = await h.open(html);
    const rects = await page.evaluate(() => [...document.querySelectorAll('input,select,button')].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => +v.toFixed(1)).join(','); }));
    const hit = await page.evaluate(() => { const b = document.querySelector('.x'); if (!b) return null; const r = b.getBoundingClientRect(); return [document.elementFromPoint(r.x - 8, r.y - 8) === b, document.elementFromPoint(r.right + 8, r.y + 4)?.tagName]; });
    const r = await h.scan(page, ['target-size-minimum']);
    console.log('==', n, rects.join(' | '), hit ? 'hit outside box: ' + hit : '', '->', r[0].outcome); h.show(r);
    await page.context().close();
  }
  await h.close();
})();
