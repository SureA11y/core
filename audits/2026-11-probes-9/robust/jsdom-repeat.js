'use strict';
// Repeated scans of one jsdom DOM: same result each time? heap growth? page state left?
// node --expose-gc jsdom-repeat.js [fixtureSubstring|combined] [N]
const fs = require('node:fs');
const { JSDOM } = require('/home/user/core-r9/node_modules/jsdom');
const core = require((process.env.CORE || '/home/user/core-r9') + '/src/index.js');

const which = process.argv[2] || 'combined';
const N = Number(process.argv[3] || 10);
const html = which === 'combined' ? fs.readFileSync(__dirname + '/combined.html', 'utf8') : fs.readFileSync('/home/user/core-r9/tests/fixtures/' + which, 'utf8');

const summary = (r) => Object.fromEntries(r.checksResults.map((c) => [c.ruleId, c.outcome + ' x' + (c.occurrences || []).length + (c.error ? ' ERR ' + String(c.error).slice(0, 60) : '')]));
const occs = (r) => JSON.stringify(r.checksResults.map((c) => [c.ruleId, c.outcome, (c.occurrences || []).map((o) => [o.selector, o.outcome, o.message])]));

(async () => {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  await new Promise((r) => setTimeout(r, 10));
  const snap = () => ({
    html: dom.window.document.documentElement.outerHTML,
    globals: Object.getOwnPropertyNames(dom.window).length,
    nodeGlobals: Object.getOwnPropertyNames(globalThis).filter((k) => !['window', 'document'].includes(k)).length,
    docOwn: Object.getOwnPropertyNames(dom.window.document).join(','),
    sheets: dom.window.document.styleSheets.length
  });
  const s0 = snap();
  let first, firstOcc;
  for (let i = 0; i < N; i++) {
    const t = Date.now();
    const r = core.runDomRulesInPage('https://example.test/', null, {}, null);
    const dt = Date.now() - t;
    await new Promise((r) => setImmediate(r));
    if (global.gc) global.gc();
    const heap = Math.round(process.memoryUsage().heapUsed / 1e6);
    const s = summary(r);
    const o = occs(r);
    let d = '';
    if (!first) { first = s; firstOcc = o; }
    else {
      const diffs = Object.keys({ ...first, ...s }).filter((k) => first[k] !== s[k]).map((k) => `${k}: ${first[k]} -> ${s[k]}`);
      d = diffs.length ? ' DIFF ' + diffs.join('; ') : (o === firstOcc ? ' same' : ' same-summary, occurrence detail differs');
    }
    console.log(`scan ${i} ${dt}ms heap ${heap}MB${d}`);
  }
  const s1 = snap();
  for (const k of Object.keys(s0)) if (s0[k] !== s1[k]) console.log('STATE CHANGED', k, String(s0[k]).length, String(s1[k]).length, k === 'docOwn' ? s1[k] : '');
  if (process.argv[4] === 'detail' ) {}
})();
