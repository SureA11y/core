const h = require('./h');
const cases = require('./f1.js').filter(c => /transformed|filter anc|will-change/.test(c[0]));
(async () => {
  for (const [n, html] of cases) {
    const page = await h.open(html);
    const info = await page.evaluate(async () => {
      const out = [];
      for (const id of ['l0', 'l20', 'l40']) {
        const a = document.getElementById(id); a.focus();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = a.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + 3, r.y + r.height / 2);
        out.push(`${id}: scrollY=${scrollY} rect.y=${r.y.toFixed(0)} hit=${top && (top.id || top.tagName)} hdrTop=${document.getElementById('t').getBoundingClientRect().top.toFixed(0)}`);
      }
      // also scroll so that l20 is at y=20 and focus
      window.scrollTo(0, document.getElementById('l20').offsetTop - 20 + document.getElementById('l20').getBoundingClientRect().top - document.getElementById('l20').getBoundingClientRect().top);
      return out;
    });
    console.log(n, info);
    const r = await h.scan(page, ['focus-not-obscured-minimum']);
    h.show(r);
    await page.context().close();
  }
  await h.close();
})();
