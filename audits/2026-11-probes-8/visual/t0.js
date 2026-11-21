const { run, show, close } = require('./h');
(async () => {
  const r = await run(`<p style="color:#777;background:#fff">Hello world text</p>`, ['contrast-minimum','contrast-enhanced','contrast-computable']);
  show('basic', r, true);
  console.log(JSON.stringify(r.res[0].occ[0].d, null, 1).slice(0, 2500));
  await close();
})();
