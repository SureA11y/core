const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const n = +process.argv[2]; const kind = process.argv[3]; const eo = JSON.parse(process.argv[4] || '{}');
const body = kind === 'spans' ? '<span>a</span>'.repeat(n) : kind === 'links' ? '<a href="/">l</a> '.repeat(n) : '<div>a</div>'.repeat(n);
const dom = new JSDOM(`<!doctype html><html lang=en><head><title>S</title></head><body><main><h1>x</h1>${body}</main></body></html>`, { url: 'https://example.test/', pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const t = Date.now();
const r = core.runDomRulesInPage('https://example.test/', null, eo, null);
console.log(kind, n, JSON.stringify(eo), Date.now() - t, 'ms', r.perfStats && r.perfStats.ruleTimings ? Object.entries(r.perfStats.ruleTimings).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+Math.round(v)).join(' ') : '');
