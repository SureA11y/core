'use strict';
// jsdom: heap before a scan, peak-ish after it (before GC), and kept after GC while the DOM is alive;
// then repeated scans of the same DOM. node --expose-gc jsdom-mem.js <rows> <scans>
const { JSDOM } = require('/home/user/core-r9/node_modules/jsdom');
const { runDomRulesInPage } = require('/home/user/core-r9/src/index.js');
const rows = Number(process.argv[2] || 2000);
const scans = Number(process.argv[3] || 3);
const html = `<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>T</h1><table><caption>D</caption><thead><tr>${Array.from({ length: 8 }, (_, c) => `<th scope=col>H${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: rows }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table></main></body></html>`;
const mb = () => Math.round(process.memoryUsage().heapUsed / 1e6);
(async () => {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  await new Promise((r) => setTimeout(r, 20));
  global.gc();
  console.log('rows', rows, 'elements', dom.window.document.getElementsByTagName('*').length, 'heap with DOM, before scan', mb(), 'MB');
  for (let i = 0; i < scans; i++) {
    const t = Date.now();
    const r = runDomRulesInPage('https://example.test/', null, {}, null);
    const dt = Date.now() - t;
    const before = mb();
    await new Promise((res) => setTimeout(res, 20));
    global.gc();
    console.log(`scan ${i}: ${dt}ms, heap right after ${before} MB, after GC (result still referenced) ${mb()} MB, result JSON ${Math.round(JSON.stringify(r).length / 1e6)} MB`);
  }
})();
