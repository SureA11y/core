// usage: node bat.js cases-file.js [rules]
const h = require('./h');
const cases = require(process.argv[2]);
const rules = (process.argv[3] || 'contrast-minimum,contrast-computable').split(',');
(async () => {
  for (let [name, html, opts = {}] of cases) { if (Array.isArray(html)) html = html[0];
    if (process.argv[4] && !name.includes(process.argv[4])) continue;
    const { r, page } = await h.run(html, rules, opts.eo || {}, { keep: true, ...opts });
    console.log('=== ' + name);
    for (const c of r) {
      const occ = c.occ.filter(o => !opts.only || (o.sel||'').includes(opts.only));
      console.log('  ' + c.rule + ': ' + c.outcome + (c.error ? ' ERR ' + JSON.stringify(c.error).slice(0,300) : ''));
      for (const o of occ) {
        const d = o.d || {};
        const col = d.colors ? `${d.colors.foregroundHex}/${d.colors.backgroundHex} r=${d.metrics && d.metrics.ratio && d.metrics.ratio.toFixed(2)}` : '';
        if (o.code === 'ALL_TEXT_COMPUTABLE') continue;
        console.log('     ', o.code || '', o.sel, col, '|', o.msg.slice(0, 220));
      }
    }
    const box = await page.evaluate(() => { const e = document.getElementById('t'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.max(1, Math.min(b.width, 900)), height: Math.max(1, Math.min(b.height, 600)) }; });
    if (box && box.width >= 1) { try { console.log('   pixels', JSON.stringify(await h.pixels(page, box))); } catch (e) { console.log('   pixels err', e.message.slice(0, 100)); } }
    await page.context().close();
  }
  await h.close();
})();
