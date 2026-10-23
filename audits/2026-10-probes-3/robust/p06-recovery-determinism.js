// (1) Determinism: one page scanned 5 times in a row in one tab.
// (2) Recovery: make the scan throw part-way (a builtin that throws on its
// k-th call), then restore the builtin and scan again: the second scan must
// equal a fresh one, and the page must be left as it was.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const html = `<!doctype html><html lang="en"><head><title>t</title><style>.lo{color:#999} .sp{animation:x 1s infinite}@keyframes x{to{opacity:.5}}</style></head><body>
<header><nav><a href="/a">A</a><a href="/a">A</a></nav></header><main><h1>H</h1><h3>skip</h3>
<button></button><img src="q.png"><img src="r.png" alt="r.png"><label>Ok <input></label><input aria-describedby="nope">
<p class="lo">low contrast</p><p style="line-height:1;letter-spacing:0">t</p><div role="checkbox"></div>
<table><tr><th></th><td>1</td></tr></table><ul><div>x</div></ul><span class="sp">anim</span>
<div style="overflow:hidden;height:16px;width:40px;white-space:nowrap">clipped clipped clipped</div>
<a href="#" style="display:inline-block;width:10px;height:10px"></a><x-h></x-h>
${Array.from({ length: 200 }, (_, i) => `<p>para ${i} <a href="/p${i}">read more</a> <span style="color:#${i % 2 ? '777' : '222'}">t</span></p>`).join('')}
</main><script>customElements.define('x-h',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button></button><slot></slot>'}})</script></body></html>`;
const SCAN = '(function(){try{const r=a11ycore.runa11yCoreInPage(location.href,null,{},null);return {r:r}}catch(e){return {err:String(e&&e.message||e)}}})()';
const STATE = '(function(){const s=document.documentElement.outerHTML;let x=0;for(let i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return s.length+":"+x+":"+document.head.children.length+":"+document.styleSheets.length})()';
(async () => {
  const b = await h.browser();
  const ctx = await b.newContext(); const page = await ctx.newPage();
  const f = path.join(__dirname, 'tmp', 'recov.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html);
  await page.goto('file://' + f); await page.waitForTimeout(200);
  const cdp = await ctx.newCDPSession(page);
  await h.cdpEval(cdp, fs.readFileSync(h.BUNDLE, 'utf8') + ';void 0', 60000);
  const state0 = await h.cdpEval(cdp, STATE, 5000);
  const digests = [];
  for (let i = 0; i < 5; i++) digests.push(h.digest((await h.cdpEval(cdp, SCAN, 60000)).r));
  console.log('determinism: distinct digests over 5 scans =', new Set(digests).size);
  if (new Set(digests).size > 1) {
    const a = digests[0].split('\n');
    for (let i = 1; i < 5; i++) { const c = digests[i].split('\n'); c.forEach((l, j) => { if (l !== a[j]) console.log(' scan', i, 'differs:', a[j].slice(0, 200), '\n   vs', l.slice(0, 200)); }); }
  }
  const ref = digests[0];
  const traps = [
    ['Element.prototype', 'getBoundingClientRect'], ['window', 'getComputedStyle'], ['Map.prototype', 'set'], ['WeakMap.prototype', 'set'],
    ['Array.prototype', 'push'], ['Element.prototype', 'getAttribute'], ['Document.prototype', 'createRange'], ['Element.prototype', 'getClientRects'], ['JSON', 'stringify'], ['Object', 'keys'], ['Node.prototype', 'appendChild'], ['Node.prototype', 'removeChild'], ['Element.prototype', 'remove'], ['Element.prototype', 'setAttribute'], ['Element.prototype', 'removeAttribute'], ['HTMLElement.prototype', 'focus'],
  ];
  for (const [obj, fn] of traps) {
    for (const k of [1, 50, 500, 5000, 50000]) {
      const install = `(function(){const o=${obj};const orig=o.${fn};window.__restore=function(){o.${fn}=orig};let n=0;o.${fn}=function(){if(++n===${k})throw new Error('trap ${fn} #${k}');return orig.apply(this,arguments)};window.__trapCount=function(){return n}})()`;
      await h.cdpEval(cdp, install, 5000);
      const r1 = await h.cdpEval(cdp, SCAN, 60000);
      const calls = await h.cdpEval(cdp, 'window.__trapCount()', 5000);
      await h.cdpEval(cdp, 'window.__restore()', 5000);
      const st = await h.cdpEval(cdp, STATE, 5000);
      const r2 = await h.cdpEval(cdp, SCAN, 60000);
      const same = !r2.err && h.digest(r2.r) === ref;
      const tripped = calls >= k;
      if (!tripped) continue;
      const line = { trap: obj + '.' + fn, k, firstScan: r1.err ? 'THREW: ' + r1.err.slice(0, 60) : 'ok', stateAfterThrow: st === state0 ? 'same' : 'CHANGED ' + state0 + ' -> ' + st, secondScanSameAsFresh: same };
      if (r1.err || st !== state0 || !same) console.log(JSON.stringify(line));
      if (!same) {
        const a = ref.split('\n'), c = h.digest(r2.r).split('\n');
        c.forEach((l, j) => { if (l !== a[j]) console.log('   diff:', a[j] && a[j].slice(0, 160), '=>', l.slice(0, 160)); });
      }
    }
  }
  console.log('final state same as initial:', (await h.cdpEval(cdp, STATE, 5000)) === state0);
  await ctx.close(); await h.closeBrowser();
})();
