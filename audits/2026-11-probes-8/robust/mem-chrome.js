'use strict';
// node mem-chrome.js <hooks:0|1> <mode:same|spa|highlight|inspect|async|navigate> <N>
const C = require('./chrome-lib.js');
const fs = require('fs');
const core = require('/home/user/core-r8/src/index.js');
const { kinds } = require('./perf-pages.js');
const [hooks, mode, N] = [process.argv[2] === '1', process.argv[3], +process.argv[4]];
const PAGE = kinds.mixed(600).replace('</body>', `
<div aria-live="polite" id="live"></div><div role="status" id="st"></div>
<x-check></x-check><x-check></x-check>
<script>
customElements.define('x-check', class extends HTMLElement { constructor(){ super(); this._internals = this.attachInternals(); this._internals.role='checkbox'; this._internals.ariaLabel='Agree'; this._internals.ariaChecked='false'; } });
document.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>{}));
let k=0; setInterval(()=>{ document.getElementById('live').textContent='tick '+(k++); }, 50);
window.__spa = (seed) => {
  const m = document.querySelector('main');
  let s=''; for (let i=0;i<300;i++) s += '<p><a href="/x'+seed+'_'+i+'">L'+i+'</a><button>B</button><img src="a.png" alt="">'+'<x-check></x-check></p>';
  m.innerHTML = s;
  m.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{}));
};
</script></body>`);
(async () => {
  await C.startServer();
  const url = C.serve('/p.html', PAGE);
  const b = await C.launch(['--js-flags=--expose-gc']);
  const ctx = await b.newContext();
  if (hooks) for (const s of [core.listenerHookScript(), core.liveRegionHookScript(), core.internalsHookScript()]) await ctx.addInitScript({ content: s });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url);
  await C.inject(page);
  if (process.env.STUB) await page.evaluate(() => { console.table = () => {}; console.log = () => {}; });
  const env = await page.evaluate(() => JSON.stringify(window.a11ycore.runa11yCoreInPage(null, null, {}, null).engine.environment));
  const pts = [];
  async function measure(i) {
    for (let k = 0; k < 3; k++) await cdp.send('HeapProfiler.collectGarbage');
    const h = await cdp.send('Runtime.getHeapUsage');
    const d = await cdp.send('Memory.getDOMCounters');
    pts.push([i, +(h.usedSize / 1048576).toFixed(2), d.nodes, d.jsEventListeners, d.documents]);
  }
  for (let i = 0; i <= N; i++) {
    if (i % 10 === 0) await measure(i);
    if (i === N) break;
    if (mode === 'navigate') { await page.goto(url); await C.inject(page); }
    if (mode === 'spa') await page.evaluate((s) => window.__spa(s), i);
    await page.evaluate(async (mode) => {
      const a = window.a11ycore;
      let r;
      if (mode === 'async') r = await a.runa11yCoreInPageAsync(null, null, {}, null);
      else if (mode === 'inspectonly' || mode === 'inspectnodraw') r = { checksResults: [] };
      else r = a.runa11yCoreInPage(null, null, {}, null);
      if (mode === 'inspectonly') await a.inspect('names', {});
      if (mode === 'inspectnodraw') await a.inspect('names', { draw: false });
      if (mode === 'idle') await new Promise((res) => setTimeout(res, 20));
      if (mode === 'highlight') a.highlight(r);
      if (mode === 'inspect') await a.inspect('names', {});
      window.__last = r.checksResults.length; // keep only a number
    }, mode);
  }
  const counters = await page.evaluate(() => ({ els: document.getElementsByTagName('*').length, hl: document.querySelectorAll('[data-surea11y-highlight],[data-a11ycore-highlight]').length, symbols: Object.getOwnPropertySymbols(window).map(String), globals: Object.keys(window).filter((k) => /a11y|surea11y/i.test(k)) }));
  const first = pts[1], last = pts[pts.length - 1];
  console.log(JSON.stringify({ hooks, mode, N, env: JSON.parse(env), points: pts, perScanKB: +(((last[1] - first[1]) * 1024) / (N - 10)).toFixed(1), nodesPerScan: +((last[2] - first[2]) / (N - 10)).toFixed(1), listenersPerScan: +((last[3] - first[3]) / (N - 10)).toFixed(2), counters }));
  await b.close();
  C.server.close();
})();
