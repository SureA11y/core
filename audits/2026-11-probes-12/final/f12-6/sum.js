// node sum.js file.json : totals and contrast-rule sums of medians per build
const r = require(require('path').resolve(process.argv[2]));
const med = (a) => { a = a.filter(Number.isFinite).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
const rules = ['contrast-computable', 'contrast-enhanced', 'contrast-minimum', 'symbol-graphic-contrast'];
const builds = Object.keys(Object.values(r)[0]);
const tot = {}; const per = {};
for (const [page, by] of Object.entries(r)) {
  const line = [page.padEnd(16)];
  for (const b of builds) {
    const runs = by[b];
    const t = med(runs.map((x) => x.total)); tot[b] = (tot[b] || 0) + t;
    let pc = 0;
    for (const ru of rules) { const k = Object.keys(runs[0].rt).find((k) => k === ru || k.endsWith(ru)); const m = med(runs.map((x) => x.rt[k])); per[b] = per[b] || {}; per[b][ru] = (per[b][ru] || 0) + m; pc += m; }
    line.push(`${b}=${Math.round(t)}/${Math.round(pc)}`);
  }
  console.log(line.join(' '));
}
for (const b of builds) console.log(b, 'total', Math.round(tot[b]), JSON.stringify(Object.fromEntries(Object.entries(per[b]).map(([k, v]) => [k, Math.round(v)]))));
