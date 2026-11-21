'use strict';
// Huge values: scan time, slowest rules, result JSON size; jsdom and Chromium.
// node huge.js <case> [env both|jsdom|chrome]
const L = require('./lib.js');
const C = require('./chrome-lib.js');
console.warn = () => {};
const M = 1 << 20;
const big = (n, unit = 'a') => unit.repeat(n);
const cases = {
  alt: () => `<img src="x.png" alt="${big(M)}"><img src="y.png" alt="${big(M, 'b c ')}">`,
  label: () => `<button aria-label="${big(M)}"></button><a href="#" aria-label="${big(M)}"></a><input aria-label="${big(M, 'x ')}">`,
  classid: () => `<div class="${big(M, 'c ')}" id="${big(M)}"><button>OK</button></div>`,
  text: () => `<p>${big(5 * M, 'word ')}</p><a href="#">${big(M, 'link ')}</a><h2>${big(M, 'h ')}</h2>`,
  style: () => `<p style="${big(20000, 'color:#777;')}">x</p><style>${big(20000, '.a{color:#777} ')}</style>`,
  attrs: () => { let a = ''; for (let i = 0; i < 5000; i++) a += ` aria-x${i}="v" data-${i}="${i}"`; return `<div${a} role="button" tabindex="0">t</div>`; },
  dupids: () => { let s = ''; for (let i = 0; i < 20000; i++) s += `<span id="dup">${i}</span>`; return s + '<button aria-labelledby="dup"></button>'; },
  labelledby: () => { let ids = ''; let s = ''; for (let i = 0; i < 20000; i++) { s += `<span id="s${i}">w${i}</span>`; ids += 's' + i + ' '; } return s + `<button aria-labelledby="${ids}"></button><input aria-describedby="${ids}">`; },
  selectopts: () => { let s = '<label for="s">Pick</label><select id="s">'; for (let i = 0; i < 20000; i++) s += `<option>${i}</option>`; return s + '</select>'; },
  manyfails: () => { let s = ''; for (let i = 0; i < 20000; i++) s += `<img src="${i}.png">`; return s; },
  tablecells: () => { let s = '<table>'; for (let r = 0; r < 300; r++) { s += '<tr>'; for (let c = 0; c < 60; c++) s += r === 0 ? `<th>H${c}</th>` : `<td>${r}</td>`; s += '</tr>'; } return s + '</table>'; }
};
const name = process.argv[2], envs = process.argv[3] || 'both';
const html = `<!DOCTYPE html><html lang="en"><head><title>Huge</title></head><body><main><h1>H</h1>${cases[name]()}</main></body></html>`;
function report(env, r, ms) {
  const json = JSON.stringify(r);
  const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 120));
  const longest = r.checksResults.flatMap((c) => c.occurrences.map((o) => [c.ruleId, (o.summary || '').length + (o.hint || '').length + (o.html || '').length + (o.selector || '').length + JSON.stringify(o.data || {}).length])).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const top = Object.entries(r.perfStats.ruleTimings).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + '=' + Math.round(v));
  console.log(JSON.stringify({ case: name, env, htmlKB: Math.round(html.length / 1024), ms: Math.round(ms), resultKB: Math.round(json.length / 1024), errors: errs, largestOccurrenceChars: longest, top }));
}
(async () => {
  if (envs !== 'chrome') {
    const t = Date.now();
    try { const { r } = L.scanJsdom(html, { perfStats: true, profileRules: true }); report('jsdom', r, Date.now() - t); } catch (e) { console.log(name, 'jsdom THROW', e.message.slice(0, 300)); }
  }
  if (envs !== 'jsdom') {
    const b = await C.launch();
    const p = await b.newPage();
    await p.setContent(html, { timeout: 120000 });
    await C.inject(p);
    const t = Date.now();
    try { const r = await C.scan(p, { perfStats: true, profileRules: true }); report('chrome', r, Date.now() - t); } catch (e) { console.log(name, 'chrome THROW', e.message.slice(0, 300)); }
    await b.close();
  }
})();
