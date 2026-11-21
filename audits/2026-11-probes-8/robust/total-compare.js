'use strict';
// Full-scan time, 1.17.0 vs main, Chromium, interleaved; top rules at each size. node total-compare.js kind n1,n2 reps
const fs = require('fs');
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const { kinds, wrap } = require('./perf-pages.js');
Object.assign(kinds, require('./perf-pages2.js').kinds);
kinds.manyshadow = (n) => { let s = ''; for (let i = 0; i < n; i++) s += `<x-item><template shadowrootmode="open"><div class="row"><button aria-label="Act ${i}"><slot></slot></button><span style="color:#777">meta ${i}</span><x-inner><template shadowrootmode="open"><a href="/i${i}">in</a></template></x-inner></div></template>Item ${i}</x-item>`; return wrap(s); };
kinds.frames = (n) => { let s = ''; for (let i = 0; i < n; i++) s += `<iframe title="f${i}" srcdoc="<html lang=en><title>t</title><button>b${i}</button><img src=x><p style='color:#999'>low</p>"></iframe>`; return wrap(s); };
kinds.throwingce = (n) => { let s = ''; for (let i = 0; i < n; i++) s += `<x-bad aria-label="x${i}" tabindex="0">t${i}</x-bad>`; return wrap(s).replace('</body>', `<script>customElements.define('x-bad',class extends HTMLElement{get shadowRoot(){throw new Error('sr')}get tagName(){throw new Error('tn')}getAttribute(n){throw new Error('ga')}get textContent(){throw new Error('tc')}get childNodes(){throw new Error('cn')}getBoundingClientRect(){throw new Error('gbcr')}get attributes(){throw new Error('at')}get parentNode(){throw new Error('pn')}get id(){throw new Error('id')}})</script></body>`); };
const B = { base: fs.readFileSync('/tmp/surea11y-audit/r7/robust/base.browser.js', 'utf8'), head: C.BUNDLE };
const [kind, sizes, reps] = [process.argv[2], process.argv[3].split(',').map(Number), +(process.argv[4] || 3)];
(async () => {
  const b = await C.launch();
  for (const n of sizes) {
    const html = kinds[kind](n);
    const t = { base: [], head: [] };
    for (let k = 0; k < reps; k++) for (const v of k % 2 ? ['head', 'base'] : ['base', 'head']) {
      const p = await b.newPage();
      await p.setContent(html, { timeout: 120000 });
      await p.waitForTimeout(100);
      await p.evaluate(B[v]);
      const r = await p.evaluate(() => {
        const t = performance.now();
        let r;
        try { r = window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null); } catch (e) { return { thrown: String(e.message).slice(0, 200) }; }
        return { ms: performance.now() - t, rt: r.perfStats.ruleTimings, errors: r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 80)), sig: r.checksResults.map((c) => c.outcome[0] + c.occurrences.length).join('') };
      });
      t[v].push(r);
      await p.close();
    }
    if (t.head[0].thrown || t.base[0].thrown) { console.log(kind, n, 'THROWN', t.base[0].thrown, '|', t.head[0].thrown); continue; }
    const top = Object.entries(t.head[0].rt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + '=' + v.toFixed(0));
    console.log(JSON.stringify({ kind, n, baseMs: Math.round(L.median(t.base.map((x) => x.ms))), headMs: Math.round(L.median(t.head.map((x) => x.ms))), headErrors: t.head[0].errors.slice(0, 3), baseErrors: t.base[0].errors.length, headStable: new Set(t.head.map((x) => x.sig)).size === 1, top }));
  }
  await b.close();
})();
