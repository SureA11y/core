'use strict';
// Full-scan time per fixture: 1.17.0 (23e0a387) vs HEAD (ec664338), Chromium, interleaved, median of REPS.
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const L = require('./lib.js');
const B = { base: fs.readFileSync('/tmp/surea11y-audit/r7/robust/base.browser.js', 'utf8'), head: fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8') };
const FIX = '/home/user/core/tests/fixtures';
const files = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const REPS = +(process.argv[2] || 5);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = {};
  for (const f of files) {
    const html = fs.readFileSync(`${FIX}/${f}`, 'utf8');
    const t = { base: [], head: [] };
    const outs = {};
    for (let k = 0; k < REPS; k++) {
      for (const v of k % 2 ? ['head', 'base'] : ['base', 'head']) {
        const p = await b.newPage();
        p.on('dialog', (d) => d.dismiss().catch(() => {}));
        await p.setContent(html, { timeout: 30000 }).catch(() => {});
        await p.addScriptTag({ content: B[v] });
        const r = await p.evaluate(() => { const t = performance.now(); const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null); return { ms: performance.now() - t, o: r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length) }; });
        t[v].push(r.ms);
        outs[v] = r.o;
        await p.close();
      }
    }
    const diffs = outs.head.filter((x) => !outs.base.includes(x));
    res[f] = { base: L.median(t.base), head: L.median(t.head), diffs };
    console.log(JSON.stringify({ f, base: +res[f].base.toFixed(1), head: +res[f].head.toFixed(1), ratio: +(res[f].head / res[f].base).toFixed(2), outcomeChanges: diffs }));
  }
  const sb = Object.values(res).reduce((a, x) => a + x.base, 0), sh = Object.values(res).reduce((a, x) => a + x.head, 0);
  const ratios = Object.values(res).map((x) => x.head / x.base);
  console.log(JSON.stringify({ totalBase: +sb.toFixed(0), totalHead: +sh.toFixed(0), ratio: +(sh / sb).toFixed(3), medianRatio: +L.median(ratios).toFixed(3) }));
  await b.close();
})();
