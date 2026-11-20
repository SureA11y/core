const { run, show, close } = require('./h');
(async () => {
  const r = await run(`<button style="width:20px;height:20px;padding:0">a</button><button style="width:20px;height:20px;padding:0">b</button>`, ['target-size-minimum','target-size-enhanced'], { eo: { wcagLevel: 'AAA' } });
  show('basic', r, true);
  console.log(JSON.stringify(r.res[0].occ[0].d, null, 1).slice(0, 2000));
  await close();
})();
