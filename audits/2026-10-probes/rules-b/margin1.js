const h = require('./h.js'); const { jscan } = require('./j.js');
const W = '<style>html{background:#fff}</style>';
const fails = Array.from({length:60},(_, i)=>`<p style="color:#999">fail ${i}</p>`).join('');
const cases = {
  trunc: `${W}${fails}<p id=close style="color:#757575">close pass</p><p style="color:#000">far</p>`,
  trunc_before: `${W}<p id=close style="color:#757575">close pass</p>${fails}<p style="color:#000">far</p>`,
  tie: `${W}<p id=a style="color:#757575">a</p><p id=b style="color:#757575">b</p>`,
  large_vs_normal: `${W}<p style="font-size:30px;color:#949494">big</p><p style="color:#757575">normal</p>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    for (const env of ['chromium','jsdom']) {
      const r = env==='chromium' ? await h.scan(body, { rules: ['contrast-minimum','contrast-enhanced'] }) : jscan(body, { rules: ['contrast-minimum','contrast-enhanced'] });
      for (const id of ['contrast-minimum','contrast-enhanced']) { const m = r[id].margin; console.log(k.padEnd(16), env.padEnd(8), id.padEnd(18), r[id].outcome, r[id].occ.length, m ? `${m.value.toFixed(4)}/${m.threshold} hr=${m.headroom.toFixed(4)} n=${m.measuredCount} ${m.selector}` : 'no margin'); }
    }
  }
  await h.close();
})();
