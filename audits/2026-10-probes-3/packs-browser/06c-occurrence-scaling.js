'use strict';
// How scan time grows with the number of occurrences a pack rule returns
// (same element each time, and distinct elements), in Chromium.
const L = require('./lib');
const { packScript } = L.packApi;
const mk = (n, distinct) => L.pack({
  name: 'many', namespace: 'many',
  rules: [L.rule('many-occ', new Function(`return (ctx) => { const els = ${distinct ? "Array.from(ctx.document.querySelectorAll('span'))" : 'null'}; const b = ctx.document.body; const occ = []; for (let i = 0; i < ${n}; i++) occ.push({ __node: els ? els[i] : b, summary: 's' + i }); return { outcome: 'fail', occurrences: occ }; }`)())]
});
(async () => {
  await L.withBrowser(async (b) => {
    const rows = [];
    for (const distinct of [false, true]) {
      for (const n of [5000, 10000, 20000, 40000]) {
        const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${distinct ? '<span>x</span>'.repeat(n) : ''}</main></body></html>`;
        const { page, context } = await L.openPage(b, { html });
        await page.addScriptTag({ content: L.BUNDLE });
        await page.addScriptTag({ content: packScript([mk(n, distinct)]) });
        const ms = await page.evaluate(() => { const t = performance.now(); window.a11ycore.runa11yCoreInPage(null, null, { packs: ['many@1.0.0'] }, ['many-occ']); return Math.round(performance.now() - t); });
        rows.push({ distinct, n, inPageMs: ms });
        await context.close();
      }
    }
    L.log('scan time (in page, excluding serialization)', rows);
  });
})();
