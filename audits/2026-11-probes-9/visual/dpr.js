const h = require('./h');
const files = ['./tsp1.js', './tsp2.js', './ts1.js', './c1.js', './c4.js', './f1.js', './l1.js'];
const rules = ['text-spacing-content-loss', 'target-size-minimum', 'contrast-minimum', 'contrast-computable', 'focus-not-obscured-minimum', 'link-in-text-block'];
(async () => {
  for (const f of files) for (let [n, html, opts = {}] of require(f)) {
    if (Array.isArray(html)) html = html[0];
    const out = [];
    for (const dpr of [1, 2, 1.25]) {
      const r = await h.run(html, rules, {}, { ...opts, dpr });
      out.push(r.map(c => c.outcome + ':' + c.occ.map(o => o.code).sort().join('+')).join(' '));
    }
    if (out[0] !== out[1] || out[0] !== out[2]) console.log('DIFF', f, n, '\n  1:', out[0], '\n  2:', out[1], '\n  1.25:', out[2]);
  }
  console.log('done'); await h.close();
})();
