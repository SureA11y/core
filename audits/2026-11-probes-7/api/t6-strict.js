const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const core = require('/home/user/core/src/index.js');
const tick = () => new Promise(r => setImmediate(r));
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"></main></body></html>';
(async () => {
  const cases = [
    { profile: ['wcag22-aa', 42] }, { profile: ['wcag22-aa', ''] }, { profile: ['wcag22-aa','nope'] }, { profile: 'nope' }, { profile: ['nope'] }, { profile: [] },
    { profile: 'wcag22-aa', wcagLevel: 'AA' }, { profile: ['wcag22-aa','wcag21-a'], wcagVersion: '2.1' },
    { locale: 'xx' }, { locale: 'DE' }, { locale: 'de-AT' }, { locale: 42 }, { excludeSelectors: 'main' }, { excludeSelectors: ['::bad('] }, { excludeSelectors: [42] },
    { packs: {} }, { packs: [null] }, { packs: 'x' }, { rules: { 'img-alt-present': 5 } }, { rules: { __proto__: { x: 1 } } }, { ['__proto__']: { locale: 'de' } }, { constructor: 1 },
    { output: { includeHtml: 'yes' } }, { contrast: { mode: 'strict' } }, { profile: { id: 'x' } },
  ];
  for (const c of cases) {
    const eo = Object.assign(Object.create(null), c); // careful: __proto__ case
    const opts = { strictOptions: true, ...c };
    let msg;
    try { const r = await runa11yCoreOnHtml(html, { engineOptions: opts }); msg = 'OK profile=' + r.engine.profile + ' locale=' + r.engine.locale + ' n=' + r.checksResults.length; } catch (e) { msg = 'THROW ' + e.code + ' ' + (e.problems ? JSON.stringify(e.problems.map(p => p.path + ':' + p.kind)) : e.message.slice(0, 150)); }
    console.log(JSON.stringify(c), '=>', msg);
    await tick();
  }
})();
