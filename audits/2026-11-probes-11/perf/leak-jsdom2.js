'use strict';
// node --expose-gc leak-jsdom2.js <build>: big realistic pages, then fixtures x2; heap after GC at boundaries.
const b = process.argv[2]; const CORE = `/home/user/core-${b}`;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages, fixtures, FIX } = require('./pages'); const fs = require('fs');
const mb = () => +(process.memoryUsage().heapUsed / 1e6).toFixed(1);
const settle = async () => { for (let i = 0; i < 3; i++) { await new Promise((r) => setTimeout(r, 50)); global.gc(); } };
const scan = (html) => { const d = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document; runDomRulesInPage('https://example.test/', null, {}, null); d.window.close(); global.window = undefined; global.document = undefined; };
(async () => {
  const fx = fixtures().map((f) => fs.readFileSync(FIX + '/' + f, 'utf8'));
  await settle(); console.log(b, 'start', mb());
  for (const k of ['news', 'composite', 'table']) { scan(pages[k]()); await settle(); console.log('after', k, mb()); }
  for (let round = 0; round < 3; round++) { for (const h of fx) scan(h); await settle(); console.log('after fixtures round', round + 1, mb()); }
  scan('<!doctype html><title>t</title><p>x'); await settle(); console.log('after tiny page', mb());
})();
