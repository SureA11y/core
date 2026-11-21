'use strict';
// What holds the memory a jsdom scan leaves: jsdom's style cache (cleared by a DOM change) or something else?
const { JSDOM } = require('/home/user/core-r9/node_modules/jsdom');
const { runDomRulesInPage } = require('/home/user/core-r9/src/index.js');
const rows = Number(process.argv[2] || 2000);
const html = `<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>T</h1><table><caption>D</caption><tbody>${Array.from({ length: rows }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table></main></body></html>`;
const mb = () => Math.round(process.memoryUsage().heapUsed / 1e6);
const settle = async () => { await new Promise((r) => setTimeout(r, 20)); global.gc(); };
(async () => {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  await settle();
  const g0 = new Set(Object.getOwnPropertyNames(dom.window));
  const d0 = new Set(Object.getOwnPropertyNames(dom.window.document));
  console.log('before scan', mb(), 'MB');
  runDomRulesInPage('https://example.test/', null, {}, null);
  await settle();
  console.log('after scan', mb(), 'MB; new window props:', Object.getOwnPropertyNames(dom.window).filter((k) => !g0.has(k)), 'new document props:', Object.getOwnPropertyNames(dom.window.document).filter((k) => !d0.has(k)), 'symbols on window:', Object.getOwnPropertySymbols(dom.window).map(String));
  dom.window.document.body.appendChild(dom.window.document.createElement('i'));
  await settle();
  console.log('after a DOM change to the scanned page (clears jsdom style cache)', mb(), 'MB');
  if (process.argv[3]) { const d2 = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); await settle(); const b2 = mb(); for (const el of d2.window.document.querySelectorAll('*')) { const cs = d2.window.getComputedStyle(el); void cs.color; void cs.display; } await settle(); console.log('control: getComputedStyle on every element of a fresh copy adds', mb() - b2, 'MB'); }
})();
