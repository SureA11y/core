// Which rules still copy a huge page value into their results (after the quoteText change)?
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const big = 'Z'.repeat(200000);
const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1>
<div role="${big}">r</div>
<input autocomplete="${big}" aria-label="x">
<p lang="${big}">x</p>
<div id="${big}">a</div><div id="${big}">b</div>
<a href="/x">${big}</a><a href="/y">${big}</a>
<button aria-label="${big}">Go</button>
<img src="a.png" alt="${big}">
<input type="text" id="f1" aria-labelledby="nope-${big}">
<div aria-describedby="${big}">d</div>
<label for="f2">${big}</label><input id="f2" type="text">
<input type="text" placeholder="${big}">
<div role="img" aria-label="${big}"></div>
<h2>${big}</h2>
<a href="/${big}">same</a><a href="/other">same</a>
<input type="checkbox" aria-checked="${big}">
<svg role="img"><title>${big}</title></svg>
<abbr title="${big}">x</abbr>
<iframe title="${big}" src="about:blank"></iframe>
<table><caption>${big}</caption><tr><th>${big}</th></tr><tr><td>1</td></tr></table>
<div tabindex="${big}">t</div>
<input type="text" aria-label="x" aria-invalid="${big}">
<meta name="viewport" content="${big}">
</main></body></html>`;
const warn = console.warn; console.warn = () => {};
const t0 = Date.now();
const r = runa11yCoreOnHtml(html, { engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } });
console.warn = warn;
console.log('scan ms', Date.now() - t0, 'total JSON', JSON.stringify(r).length);
const rows = r.checksResults.map(c => [c.ruleId, JSON.stringify(c).length]).filter(x => x[1] > 150000).sort((a, b) => b[1] - a[1]);
for (const [id, n] of rows) {
  const c = r.checksResults.find(x => x.ruleId === id);
  // where are the big strings?
  const paths = [];
  (function walk(v, p) { if (typeof v === 'string') { if (v.length > 5000) paths.push(p + '(' + v.length + ')'); } else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p + '.' + k); })(c, '');
  console.log(id.padEnd(36), n, paths.filter(p => !/selector|snippet|html|target|xpath/i.test(p)).slice(0, 6).join(' '));
}
