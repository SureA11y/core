'use strict';
// jsdom corpus timing for one build: node corpus-jsdom.js <build> <out.json> [subset]
const fs = require('node:fs'); const path = require('node:path');
const [build, out, subset = 'all'] = process.argv.slice(2);
const CORE = `/home/user/core-${build}`;
const { JSDOM } = require(CORE + '/node_modules/jsdom');
const { runDomRulesInPage } = require(CORE + '/src/index.js');
const { pages, fixtures, FIX } = require('./pages');
const list = [];
if (subset !== 'realistic') for (const f of fixtures()) list.push(['fx:' + f.replace('-all-scenarios.html', ''), fs.readFileSync(path.join(FIX, f), 'utf8')]);
if (subset !== 'fixtures') for (const [k, g] of Object.entries(pages)) list.push(['gen:' + k, g()]);
const res = {};
(async () => {
  for (const [name, html] of list) {
    const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
    global.window = dom.window; global.document = dom.window.document;
    const t = performance.now();
    let r, err;
    try { r = runDomRulesInPage('https://example.test/', null, { perfStats: true, profileRules: true }, null); if (r && r.then) r = await r; } catch (e) { err = String(e).slice(0, 200); }
    const total = performance.now() - t;
    const ps = (r && (r.perfStats || (r.engine && r.engine.perfStats))) || {};
    res[name] = { total, warm: ps.warmUpMs || 0, rt: ps.ruleTimings || {}, err };
    dom.window.close();
    await new Promise((x) => setTimeout(x, 5));
  }
  fs.writeFileSync(out, JSON.stringify(res));
  console.log(build, 'done', Math.round(Object.values(res).reduce((a, x) => a + x.total, 0)), 'ms', Math.round(process.memoryUsage().heapUsed / 1e6), 'MB');
})();
