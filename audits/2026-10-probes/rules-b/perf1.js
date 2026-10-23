const h = require('./h.js');
const RULES = ['contrast-minimum','contrast-enhanced','contrast-computable','link-in-text-block','target-size-minimum','text-spacing-content-loss','css-orientation-lock','img-alt-quality-manual','css-focus-indicator-suppressed-manual'];
const gens = {
  paras: (n) => `<style>html{background:#fff}</style>` + Array.from({length:n},(_, i)=>`<p>Paragraph ${i} with <a href="#">link ${i}</a> text</p>`).join(''),
  oneband: (n) => `<style>html{background:#fff}</style><div style="white-space:nowrap;overflow:auto">` + Array.from({length:n},(_, i)=>`<span>w${i} </span>`).join('') + '</div>',
  stacked: (n) => `<style>html{background:#fff}</style><div style="position:relative;height:50px">` + Array.from({length:n},(_, i)=>`<span style="position:absolute;left:0;top:0">t${i}</span>`).join('') + '</div>',
  deep: (n) => `<style>html{background:#fff}</style>` + '<div style="background:rgba(255,255,255,.01)">'.repeat(n) + 'Deep text <a href=#>link</a>' + '</div>'.repeat(n),
  buttons: (n) => `<style>html{background:#fff}</style>` + Array.from({length:n},(_, i)=>`<button style="width:20px;height:20px;padding:0;margin:1px">${i%10}</button>`).join(''),
};
(async () => {
  const which = process.argv[2]; const ns = process.argv.slice(3).map(Number);
  for (const n of ns) {
    const t0 = Date.now();
    const r = await h.scan(gens[which](n), { rules: RULES, opts: { perfStats: true, profileRules: true }, full: true });
    const t = r.perfStats && r.perfStats.ruleTimings || {};
    console.log(which, n, 'wall', Date.now() - t0, Object.entries(t).map(([k, v]) => `${k.replace(/-manual|contrast-/g,'')}=${Math.round(v)}`).join(' '));
  }
  await h.close();
})();
