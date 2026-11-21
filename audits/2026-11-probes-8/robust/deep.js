'use strict';
// Deep nesting built through the DOM (parsers cap depth): errors and timing per rule, jsdom + Chromium.
// node deep.js <depth> [env=both|jsdom|chrome] [shadow=0|1]
const L = require('./lib.js');
const C = require('./chrome-lib.js');
const depth = +process.argv[2];
const envs = (process.argv[3] || 'both');
const shadow = process.argv[4] === '1';
console.warn = () => {};
function build(doc, depth, shadow) {
  let cur = doc.querySelector('main');
  for (let i = 0; i < depth; i++) {
    const tag = 'div';
    const el = doc.createElement(tag);
    if (i % 50 === 0) el.setAttribute('role', 'group');
    if (i % 97 === 0) el.setAttribute('aria-label', 'L' + i);
    if (i % 31 === 0) el.style.color = '#777';
    if (shadow && i % 100 === 0 && el.attachShadow) { const sr = el.attachShadow({ mode: 'open' }); sr.appendChild(doc.createElement('slot')); }
    cur.appendChild(el);
    cur = el;
  }
  cur.innerHTML = '<button></button><a href="#">deep</a><img src="x.png"><input><span style="color:#eee">low</span><h3></h3>';
}
const HTML = '<!DOCTYPE html><html lang="en"><head><title>Deep</title></head><body><main><h1>Deep</h1></main></body></html>';
function summarize(env, r, ms) {
  const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 160));
  const t = r.perfStats && r.perfStats.ruleTimings ? Object.entries(r.perfStats.ruleTimings).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + '=' + v.toFixed(0)) : [];
  const deepFinds = r.checksResults.filter((c) => c.occurrences.some((o) => /button|img|input|h3|deep|span/.test(o.html || '') && (o.selector || '').length > 0 && (o.html || '').length < 200)).map((c) => c.ruleId + ':' + c.outcome);
  console.log(JSON.stringify({ env, depth, shadow, ms: Math.round(ms), warm: r.perfStats && Math.round(r.perfStats.warmUpMs), errors: errs, top: t, deepFinds: deepFinds.slice(0, 30), walkLimit: r.checksResults.filter((c) => c.ancestorWalkLimit).map((c) => c.ruleId) }));
}
(async () => {
  if (envs !== 'chrome') {
    const dom = L.open(HTML);
    build(dom.window.document, depth, shadow);
    const t = Date.now();
    let r;
    try { r = L.scanJsdom(HTML, { perfStats: true, profileRules: true }, null, dom).r; summarize('jsdom', r, Date.now() - t); } catch (e) { console.log('jsdom THROW', e.message); }
  }
  if (envs !== 'jsdom') {
    const b = await C.launch();
    const p = await b.newPage();
    await p.setContent(HTML);
    await p.evaluate(`(${build.toString()})(document, ${depth}, ${shadow})`);
    await C.inject(p);
    const t = Date.now();
    try { const r = await C.scan(p, { perfStats: true, profileRules: true }); summarize('chrome', r, Date.now() - t); } catch (e) { console.log('chrome THROW', e.message.slice(0, 400)); }
    await b.close();
  }
})();
