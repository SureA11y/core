'use strict';
// node ab-jsdom.js <build> <rules|all> <page> [reps=3] : jsdom, runOnly, median per rule
const [b, rules, pg, reps = 3] = process.argv.slice(2);
const CORE = `/home/user/core-${b}`;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages } = require('./pages');
let html; if (pg.startsWith('scale:')) { const [, sh, n] = pg.split(':'); const { S } = require('./scale-chrome'); html = `<!doctype html><html lang=en><head><meta charset=utf-8><title>S</title></head><body><main id=main><h1>S</h1>${S[sh](+n)}</main></body></html>`; } else html = pages[pg]();
const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const out = {}; const tot = [];
for (let i = 0; i < +reps; i++) {
  const d = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document;
  const t = performance.now();
  const r = runDomRulesInPage('https://example.test/', null, { perfStats: true, profileRules: true }, rules === 'all' ? null : rules.split(','));
  tot.push(performance.now() - t);
  for (const [k, v] of Object.entries(r.perfStats.ruleTimings)) (out[k] = out[k] || []).push(v);
  out.__warm = (out.__warm || []).concat(r.perfStats.warmUpMs || 0);
  d.window.close();
}
console.log(`${b} ${pg} total=${med(tot).toFixed(0)} ` + Object.entries(out).map(([k, v]) => [k, med(v)]).sort((a, c) => c[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}=${v.toFixed(0)}`).join(' '));
