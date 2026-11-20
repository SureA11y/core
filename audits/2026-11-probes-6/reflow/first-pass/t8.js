const fs = require('fs');
const { page, withBrowser, scan } = require('./harness');
const FIX = fs.readFileSync('/home/user/core/tests/fixtures/reflow-horizontal-scroll-all-scenarios.html', 'utf8');
(async () => {
  await withBrowser(async (b) => {
    const cap = await scan(b, page('', Array.from({ length: 55 }, (_, i) => `<div style="width:600px">w${i}</div>`).join('')), { raw: true });
    console.log('cap occurrences', cap.check.occurrences.length, 'error', JSON.stringify(cap.check.error || null), Object.keys(cap.check).join(','));
    const composite = page('table{width:600px} .card{overflow:hidden} .row{display:flex;width:560px}.row>*{flex:none;width:270px}', '<div class="card"><div class="row"><a href=#>a</a><a href=#>b</a></div></div><table><tr><th>A</th></tr></table><pre>' + 'x'.repeat(80) + '</pre><div style="overflow-x:auto"><form style="width:600px"><input></form></div>');
    for (const [n, h] of [['fixture', FIX], ['composite', composite]]) {
      const outs = new Set();
      for (let i = 0; i < 5; i++) { const r = await scan(b, h); outs.add(JSON.stringify([r.outcome, r.f])); }
      console.log(n, 'distinct results over 5 runs:', outs.size, [...outs][0].slice(0, 300));
    }
  });
})();
