const { run, show, close } = require('./h');
(async () => {
  const r = await run(`<input placeholder="Search" style="color:#000">`, ['contrast-minimum'], { after: p => p.evaluate(() => getComputedStyle(document.querySelector('input'), '::placeholder').color) });
  console.log(r.extra); show('ph', r, true);
  const r2 = await run(`<input placeholder="Search" style="color:#000"><style>::placeholder{color:#bbb}</style>`, ['contrast-minimum'], {});
  show('ph light', r2, true);
  await close();
})();
