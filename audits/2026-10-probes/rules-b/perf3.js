const h = require('./h.js');
(async () => {
  for (const n of [10000, 20000, 40000]) {
    for (const color of ['#000', null]) {
      const body = `<style>html{background:#fff}</style>` + Array.from({length:n},(_, i)=>`<p style="color:${color || `rgb(${i%200},${Math.floor(i/200)%200},0)`}">P ${i}</p>`).join('');
      const r = await h.scan(body, { rules: ['contrast-minimum','contrast-computable'], opts: { perfStats: true, profileRules: true }, full: true });
      const t = r.perfStats.ruleTimings;
      console.log(n, color ? 'all-tied' : 'distinct', 'min', Math.round(t['contrast-minimum']), 'computable', Math.round(t['contrast-computable']));
    }
  }
  await h.close();
})();
