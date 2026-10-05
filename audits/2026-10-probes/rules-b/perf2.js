const h = require('./h.js');
const gen = (n, color, wrap) => `<style>html{background:#fff}</style>` + Array.from({length:n},(_, i)=> wrap ? `<div><p style="color:${color}">Paragraph ${i} text</p></div>` : `<p style="color:${color}">Paragraph ${i} text</p>`).join('');
(async () => {
  for (const [label, color, wrap] of [['pass-ties-siblings','#000',false],['fail-no-candidates','#aaa',false],['pass-ties-wrapped','#000',true]]) {
    for (const n of [5000, 10000, 20000]) {
      const r = await h.scan(gen(n, color, wrap), { rules: ['contrast-minimum'], opts: { perfStats: true, profileRules: true }, full: true });
      console.log(label, n, Math.round(r.perfStats.ruleTimings['contrast-minimum']), 'ms');
    }
  }
  await h.close();
})();
