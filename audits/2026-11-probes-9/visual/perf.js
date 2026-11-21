const h = require('./h');
const rules = ['contrast-minimum','contrast-enhanced','contrast-computable','link-in-text-block','target-size-minimum','target-size-enhanced','text-spacing-content-loss','focus-not-obscured-minimum','focus-not-obscured-enhanced','css-hidden-focus','css-focus-indicator-suppressed','moving-content-pausable','css-orientation-lock'];
function page(n) {
  let s = '<style>body{margin:0;font:14px Arial}header{position:sticky;top:0;background:#fff;height:50px;box-shadow:0 1px 3px #0003}.card{display:inline-block;width:220px;height:140px;overflow:hidden;margin:6px;padding:8px;border-radius:8px;background:linear-gradient(#fafafa,#eee);vertical-align:top}.card a{color:#06c}.tag{display:inline-block;padding:2px 6px;background:rgba(0,0,0,.06);border-radius:10px;font-size:12px;color:#666}a:focus{outline:none}@keyframes p{50%{opacity:.5}}.live{animation:p 2s infinite}</style><header><a href=#>Home</a> <a href=#>Shop</a><span class=live>●</span></header><main>';
  for (let i = 0; i < n; i++) s += `<div class=card><h3 style="margin:0">Product ${i}</h3><p style="margin:4px 0">Great product number ${i} with a <a href="#p${i}">detail link</a> inside text and more words to wrap.</p><span class=tag>new</span> <span class=tag>sale</span><button style="all:unset;font-size:11px;padding:2px">Add</button><button style="all:unset;font-size:11px;padding:2px">♡</button></div>`;
  return s + '</main>';
}
(async () => {
  for (const n of [200, 800]) {
    const p = await h.open(page(n));
    for (const rule of rules) {
      const t = Date.now();
      await h.scan(p, [rule]);
      const dt = Date.now() - t;
      if (dt > 500) console.log(n, rule, dt + 'ms');
    }
    const t = Date.now(); await h.scan(p, rules); console.log(n, 'all', Date.now() - t, 'ms');
    await p.context().close();
  }
  await h.close();
})();
