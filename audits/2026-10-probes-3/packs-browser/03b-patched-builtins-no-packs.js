'use strict';
// Control for 03: the same patched built-ins with no pack named, and whether
// the pack script alone (Object.assign) is what breaks.
const L = require('./lib');
const { packScript } = L.packApi;
const P = L.pack({ name: '@h/pack', version: '1.0.0', namespace: 'h', rules: [L.rule('h-one', () => ({ outcome: 'pass' }))] });
const cases = {
  'Array.prototype.map throws': 'Array.prototype.map = function(){ throw new Error("map patched") };',
  'Object.keys returns []': 'Object.keys = function(){ return [] };',
  'Object.assign returns target': 'Object.assign = function(t){ return t };'
};
(async () => {
  await L.withBrowser(async (b) => {
    for (const [label, js] of Object.entries(cases)) {
      for (const names of [null, ['@h/pack@1.0.0']]) {
        const html = `<!doctype html><html lang="en"><head><title>t</title><script>${js}</script></head><body><main><img src="a.png"></main></body></html>`;
        const { page, context } = await L.openPage(b, { html });
        await page.addScriptTag({ content: L.BUNDLE });
        await page.addScriptTag({ content: packScript([P]) });
        const r = await L.scanInPage(page, names).then((r) => ({ type: typeof r, keys: r && Object.keys(r).slice(0, 8), n: r && r.checksResults && r.checksResults.length, packs: r && r.engine && r.engine.packs }), (e) => ({ error: e.message.split('\n')[0] }));
        L.log(`${label} / packs ${names ? 'named' : 'none'}`, r);
        await context.close();
      }
    }
  });
})();
