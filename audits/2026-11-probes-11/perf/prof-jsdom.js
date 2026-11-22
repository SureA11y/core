'use strict';
// node prof-jsdom.js <build> <rules|all> <page> : CPU profile of one jsdom scan (after one warm scan), self + inclusive
const inspector = require('node:inspector'); const fs = require('fs');
const [b, rules, pg] = process.argv.slice(2);
const CORE = `/home/user/core-${b}`;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages } = require('./pages');
let html; if (pg.startsWith('scale:')) { const [, sh, n] = pg.split(':'); const { S } = require('./scale-chrome'); html = `<!doctype html><html lang=en><head><meta charset=utf-8><title>S</title></head><body><main id=main><h1>S</h1>${S[sh](+n)}</main></body></html>`; } else html = pages[pg]();
const run = () => { const d = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document; runDomRulesInPage('https://example.test/', null, { perfStats: true, profileRules: true }, rules === 'all' ? null : rules.split(',')); d.window.close(); };
run();
const s = new inspector.Session(); s.connect();
s.post('Profiler.enable', () => s.post('Profiler.setSamplingInterval', { interval: 300 }, () => s.post('Profiler.start', () => {
  run();
  s.post('Profiler.stop', (e, { profile }) => {
    fs.writeFileSync(`prof-jsdom-${b}-${pg.replace(/:/g, '_')}.cpuprofile`, JSON.stringify(profile));
    const dt = {}; profile.samples.forEach((id, i) => { dt[id] = (dt[id] || 0) + profile.timeDeltas[i]; });
    const byId = {}; const parent = {}; for (const n of profile.nodes) { byId[n.id] = n; for (const c of n.children || []) parent[c] = n.id; }
    const key = (n) => `${n.callFrame.functionName || '(anon)'}@${(n.callFrame.url || '').split('/').slice(-1)[0]}:${n.callFrame.lineNumber + 1}`;
    const self = {}, incl = {};
    for (const n of profile.nodes) { const v = (dt[n.id] || 0) / 1000; if (!v) continue; self[key(n)] = (self[key(n)] || 0) + v; const seen = new Set(); for (let x = n.id; x != null; x = parent[x]) { const k = key(byId[x]); if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + v; } } }
    const top = (o, n) => Object.entries(o).sort((a, c) => c[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${Math.round(v)}`).join('\n  ');
    console.log('SELF\n  ' + top(self, +(process.env.TOP || 15)) + '\nINCL\n  ' + top(incl, +(process.env.INCL || 30)));
  });
})));
