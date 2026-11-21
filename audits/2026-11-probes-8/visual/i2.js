const { run, close } = require('./h');
(async () => {
 for (const h of [`<div style="height:200px;overflow:auto"><p>a</p></div>`, `<div style="height:60px;overflow:auto"><p>a</p><p>b</p><p>c</p><p>d</p></div>`]) {
  const r = await run(h, ['scrollable-region-focusable']);
  const o = r.res[0].occ[0]; console.log(JSON.stringify({ lean: o.lean, sum: o.sum, d: o.d }).slice(0, 1200));
 }
 await close();
})();
