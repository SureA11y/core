'use strict';
// node --expose-gc leak-jsdom.js <build> same|many <N> [page]
const [b, mode, N = 30, pg = 'shop'] = process.argv.slice(2);
const CORE = (b==="r12"?"/home/user/r12-api":`/home/user/core-${b}`)+``;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages, fixtures, FIX } = require('./pages');
const fs = require('fs');
const mb = () => +(process.memoryUsage().heapUsed / 1e6).toFixed(1);
const settle = async () => { await new Promise((r) => setTimeout(r, 30)); global.gc(); global.gc(); };
const mk = (html) => { const d = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document; return d; };
(async () => {
  if (mode === 'same') {
    const html = pages[pg]();
    const d = mk(html);
    const W = d.window; let listeners = 0;
    const add = W.EventTarget.prototype.addEventListener, rem = W.EventTarget.prototype.removeEventListener;
    W.EventTarget.prototype.addEventListener = function (...a) { listeners++; return add.apply(this, a); };
    W.EventTarget.prototype.removeEventListener = function (...a) { listeners--; return rem.apply(this, a); };
    let timers = 0; const st = W.setTimeout, ct = W.clearTimeout; const live = new Set();
    W.setTimeout = function (f, ms, ...a) { const id = st.call(W, (...x) => { live.delete(id); f(...x); }, ms, ...a); live.add(id); return id; };
    W.clearTimeout = function (id) { live.delete(id); return ct.call(W, id); };
    await settle();
    const g0 = new Set(Object.getOwnPropertyNames(W)), d0 = new Set(Object.getOwnPropertyNames(W.document));
    const attrs = () => [...W.document.querySelectorAll('*')].reduce((a, e) => a + e.attributes.length, 0);
    const base = { heap: mb(), els: W.document.getElementsByTagName('*').length, attrs: attrs(), sheets: W.document.styleSheets.length };
    console.log(b, pg, 'before', JSON.stringify(base));
    const times = [];
    for (let i = 0; i < Number(N); i++) {
      const t = performance.now(); runDomRulesInPage('https://example.test/', null, {}, null); times.push(Math.round(performance.now() - t));
      if (i < 2 || i % 10 === 9) { await settle(); console.log('scan', i + 1, JSON.stringify({ heap: mb(), els: W.document.getElementsByTagName('*').length, attrs: attrs(), sheets: W.document.styleSheets.length, listeners, timers: live.size, newWinProps: Object.getOwnPropertyNames(W).filter((k) => !g0.has(k)), newDocProps: Object.getOwnPropertyNames(W.document).filter((k) => !d0.has(k)) })); }
    }
    console.log('times', times.join(','));
  } else {
    const list = [...fixtures().map((f) => fs.readFileSync(FIX + '/' + f, 'utf8')), ...Object.values(pages).map((g) => g())];
    await settle(); console.log(b, 'many: start', mb());
    for (let i = 0; i < Number(N); i++) {
      const d = mk(list[i % list.length]);
      runDomRulesInPage('https://example.test/', null, {}, null);
      d.window.close(); global.window = undefined; global.document = undefined;
      if (i % 40 === 39 || i === N - 1) { await settle(); console.log('pages', i + 1, 'heap', mb(), 'MB rss', Math.round(process.memoryUsage().rss / 1e6)); }
    }
  }
})();
