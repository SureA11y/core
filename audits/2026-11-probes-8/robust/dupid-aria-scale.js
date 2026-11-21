'use strict';
// duplicate-id-aria in Chromium on repeated cards that reuse ids and refer to them.
// node dupid-aria-scale.js N1,N2,.. idsPerCard [bundle]
const fs = require('fs');
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const Ns = process.argv[2].split(',').map(Number), K = +(process.argv[3] || 1);
const BUNDLE = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8') : C.BUNDLE;
function page(N) {
  let s = '';
  for (let i = 0; i < N; i++) {
    s += `<div class="card"><h3 id="title">Card ${i}</h3>`;
    if (K > 1) s += `<p id="desc">Desc ${i}</p>`;
    if (K > 2) s += `<span id="price">USD ${i}</span>`;
    s += `<a href="/p${i}" aria-labelledby="title${K > 2 ? ' price' : ''}"${K > 1 ? ' aria-describedby="desc"' : ''}>Open</a></div>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${s}</main></body></html>`;
}
(async () => {
  const b = await C.launch();
  for (const N of Ns) {
    const ts = [];
    let total;
    for (let k = 0; k < 3; k++) {
      const p = await b.newPage();
      await p.setContent(page(N));
      await p.evaluate(BUNDLE);
      const r = await p.evaluate(() => {
        const t = performance.now();
        const r = window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, { includeRuleIds: ['duplicate-id-aria'] });
        return [r.perfStats.ruleTimings['duplicate-id-aria'], performance.now() - t];
      });
      ts.push(r);
      await p.close();
    }
    console.log(JSON.stringify({ N, idsPerCard: K, elements: N * (2 + K) + 5, ruleMs: Math.round(L.median(ts.map((x) => x[0]))), scanMs: Math.round(L.median(ts.map((x) => x[1]))) }));
  }
  await b.close();
})();
