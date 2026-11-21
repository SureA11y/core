// forced colors: the browser's own placeholder and select colors are read from a blank frame that forced colors repaint
const { run, close } = require('./h');
(async () => {
 for (const fc of [undefined, 'active']) {
  for (const h of [`<input placeholder="Search here">`, `<select style="color:#999"><option>Choose</option></select>`]) {
   const r = await run(h, ['contrast-enhanced','contrast-minimum'], { forcedColors: fc });
   for (const c of r.res) for (const o of c.occ) console.log(fc || 'none', c.ruleId, o.rc, JSON.stringify(o.d).slice(0, 500));
  }
 }
 await close();
})();
