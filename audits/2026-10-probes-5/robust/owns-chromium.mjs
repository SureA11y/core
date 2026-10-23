// aria-required-parent with many aria-owns relations, in Chromium.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const V = {
  'n lists each owning its item': (n) => rep(n, (i) => `<div role="list" aria-label="l${i}" aria-owns="it${i}"></div>`) + rep(n, (i) => `<div role="listitem" id="it${i}">x</div>`),
  'one listbox owning n options': (n) => `<div role="listbox" tabindex="0" aria-label="L" aria-owns="${rep(n, (i) => 'o' + i + ' ')}"></div>` + rep(n, (i) => `<div role="option" id="o${i}" aria-selected="false">O${i}</div>`),
};
for (const [k, mk] of Object.entries(V)) for (const n of [500, 1000, 2000, 4000]) {
  const p = await b.newPage();
  await p.setContent(`<!doctype html><html lang="en"><head><title>O</title></head><body style="background:#fff"><main><h1>O</h1>${mk(n)}</main></body></html>`);
  await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(() => { const t = performance.now(); const res = window.a11ycore.runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, ['aria-required-parent', 'aria-required-children', 'aria-owns-valid']); const rt = res.perfStats.ruleTimings; return { tot: performance.now() - t, rt: Object.entries(rt).map(([a, v]) => a + '=' + Math.round(v)).join(' '), o: res.checksResults.map(c => c.ruleId + ':' + c.outcome).join(' ') }; });
  console.log(`${k} n=${n} total=${Math.round(r.tot)}ms ${r.rt} | ${r.o}`);
  await p.close();
}
await b.close();
