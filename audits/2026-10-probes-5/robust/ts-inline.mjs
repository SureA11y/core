// target-size-minimum on many inline targets in one block (Chromium): curve, with and without the listener hook.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright'); const core = req('/home/user/core/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const V = {
  'span role=link inline, hook': [(n) => rep(n, (i) => `<span class="c" role="link">S${i}</span>`), true],
  'span role=link inline, no hook': [(n) => rep(n, (i) => `<span class="c" role="link">S${i}</span>`), false],
  'a href inline, separated by spaces': [(n) => rep(n, (i) => `<a href="#${i}">L${i}</a> `), false],
  'a href inline, in <p> of 50': [(n) => rep(n / 50, (k) => '<p>' + rep(50, (i) => `<a href="#${k}-${i}">L${i}</a> `) + '</p>'), false],
  'button inline': [(n) => rep(n, (i) => `<button>B${i}</button>`), false],
};
for (const [k, [mk, hook]] of Object.entries(V)) for (const n of [1000, 2000, 4000]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  if (hook) await p.addInitScript({ content: core.listenerHookScript() });
  await p.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body style="background:#fff"><main><h1>T</h1>${mk(n)}</main></body></html>`);
  await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(() => { const t = performance.now(); const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['target-size-minimum']); const c = res.checksResults[0]; return { ms: performance.now() - t, o: c.outcome + '/' + c.occurrences.length }; });
  console.log(`${k} n=${n} target-size-minimum=${Math.round(r.ms)}ms ${r.o}`);
  await ctx.close();
}
await b.close();
