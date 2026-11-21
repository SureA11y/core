'use strict';
// One rule's time in a full scan, 1.17.0 vs main, Chromium, interleaved, median of reps, over page sizes.
// node rule-compare.js ruleId kind n1,n2,... reps
const fs = require('fs');
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const { kinds } = require('./perf-pages.js');
Object.assign(kinds, require('./perf-pages2.js').kinds);
const B = { base: fs.readFileSync('/tmp/surea11y-audit/r7/robust/base.browser.js', 'utf8'), head: C.BUNDLE };
const [rules, kind, sizes, reps] = [process.argv[2].split(','), process.argv[3], process.argv[4].split(',').map(Number), +(process.argv[5] || 5)];
(async () => {
  const b = await C.launch();
  for (const n of sizes) {
    const html = kinds[kind](n);
    const t = { base: [], head: [] };
    let el;
    for (let k = 0; k < reps; k++) for (const v of k % 2 ? ['head', 'base'] : ['base', 'head']) {
      const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
      await p.setContent(html, { timeout: 120000 });
      await p.evaluate(B[v]);
      const r = await p.evaluate((rules) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null);
        const o = {}; const ms = {};
        for (const rule of rules) { const c = r.checksResults.find((c) => c.ruleId === rule); o[rule] = c.outcome + '/' + c.occurrences.length; ms[rule] = r.perfStats.ruleTimings[rule]; }
        return { ms, el: document.getElementsByTagName('*').length, o };
      }, rules);
      t[v].push(r); el = r.el;
      await p.close();
    }
    for (const rule of rules) {
      const mb = L.median(t.base.map((x) => x.ms[rule])), mh = L.median(t.head.map((x) => x.ms[rule]));
      console.log(JSON.stringify({ rule, kind, n, el, baseMs: +mb.toFixed(1), headMs: +mh.toFixed(1), ratio: +(mh / mb).toFixed(2), outcomes: [t.base[0].o[rule], t.head[0].o[rule]] }));
    }
  }
  await b.close();
})();
