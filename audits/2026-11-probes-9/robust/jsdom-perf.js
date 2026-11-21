'use strict';
// jsdom scan time vs size for page shapes, per-rule top timings.
// node jsdom-perf.js <shape> <n1,n2,..> [coreDir]
const { JSDOM } = require('/home/user/core-r9/node_modules/jsdom');
const [shape, sizes, core] = process.argv.slice(2);
const { runDomRulesInPage } = require((core || '/home/user/core-r9') + '/src/index.js');
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'kappa', 'sigma', 'theta'];
const w = (i) => words[i % 8] + ' ' + words[(i * 7) % 8];
const shapes = {
  table: (n) => `<table><caption>Data</caption><thead><tr>${Array.from({ length: 8 }, (_, c) => `<th scope=col>H${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: n }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  links: (n) => `<nav aria-label="All"><ul>${Array.from({ length: n }, (_, i) => `<li><a href="/p/${i}">${w(i)} ${i}</a></li>`).join('')}</ul></nav>`,
  cards: (n) => `<div class=grid>${Array.from({ length: n }, (_, i) => `<article class=card><img src="/i/${i}.png" alt="Product ${i}"><h3 id=h${i}>${w(i)}</h3><p class=price>$${i}.99</p><button aria-describedby=h${i}>Add to cart</button><a href="/p/${i}">Details<span class=sr>${w(i)}</span></a></article>`).join('')}</div>`,
  form: (n) => `<form>${Array.from({ length: n }, (_, i) => `<div class=row><label for=f${i}>Field ${i}</label><input id=f${i} name=f${i} aria-describedby=d${i}><span id=d${i}>hint ${i}</span></div>`).join('')}<button>Send</button></form>`,
  headings: (n) => Array.from({ length: n }, (_, i) => `<section aria-labelledby=s${i}><h${(i % 5) + 2} id=s${i}>${w(i)} ${i}</h${(i % 5) + 2}><p>body</p></section>`).join(''),
  aria: (n) => `<div role=tree aria-label=t>${Array.from({ length: n }, (_, i) => `<div role=treeitem aria-level=1 aria-selected=false tabindex=-1 aria-expanded=false>${w(i)}</div>`).join('')}</div>`,
  ids: (n) => Array.from({ length: n }, (_, i) => `<div id=d${i % (n / 2)}><span id=s${i}>x</span><label for=s${i}>l</label></div>`).join(''),
  select: (n) => `<label>Pick <select>${Array.from({ length: n }, (_, i) => `<option value=${i}>${w(i)} ${i}</option>`).join('')}</select></label>`,
  selectNoLabel: (n) => `<select aria-label=Pick>${Array.from({ length: n }, (_, i) => `<option value=${i}>${w(i)} ${i}</option>`).join('')}</select>`,
  labelList: (n) => `<label>Choose <input type=checkbox><span>${Array.from({ length: n }, (_, i) => `<span>${w(i)}</span> `).join('')}</span></label>`,
  spans: (n) => `<p>${Array.from({ length: n }, (_, i) => `<span>${w(i)}</span> `).join('')}</p>`,
  radios: (n) => `<form>${Array.from({ length: n }, (_, i) => `<label><input type=radio name=g${i % 50} value=${i}> ${w(i)}</label>`).join('')}</form>`,
  lists: (n) => Array.from({ length: n / 10 }, (_, i) => `<ul>${Array.from({ length: 10 }, (_, j) => `<li>${w(i + j)}</li>`).join('')}</ul>`).join('')
};
(async () => {
  for (const n of sizes.split(',').map(Number)) {
    const html = `<!doctype html><html lang=en><head><meta charset=utf-8><title>Perf ${shape}</title></head><body><header><a href=#main>Skip</a></header><main id=main><h1>Perf</h1>${shapes[shape](n)}</main></body></html>`;
    const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    const t = Date.now();
    const r = runDomRulesInPage('https://example.test/', null, { perfStats: true, profileRules: true }, process.env.RUNONLY ? process.env.RUNONLY.split(',') : null);
    const total = Date.now() - t;
    const rt = (r.perfStats && r.perfStats.ruleTimings) || {};
    const top = Object.entries(rt).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}=${Math.round(v)}`);
    console.log(`jsdom ${shape} n=${n} els=${dom.window.document.getElementsByTagName('*').length} total=${total}ms warm=${r.perfStats && Math.round(r.perfStats.warmUpMs)} heap=${Math.round(process.memoryUsage().heapUsed / 1e6)}MB top: ${top.join(' ')}`);
    dom.window.close();
    await new Promise((res) => setTimeout(res, 10));
  }
})();
