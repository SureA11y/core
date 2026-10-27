// Scale in Chromium: listener hook with N listeners, live-region hook with long logs, N animations, grid tables.
// node scale-chromium.mjs [filter]
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright');
const core = req('/home/user/core/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
async function time(name, n, html, { init, after } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  if (init) await p.addInitScript({ content: init });
  await p.setContent(html, { waitUntil: 'load', timeout: 120000 });
  if (after) await p.evaluate(after);
  await p.waitForTimeout(100);
  await p.addScriptTag({ content: BUNDLE });
  const r = await p.evaluate(() => { const t = performance.now(); const res = window.a11ycore.runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, null); const tot = performance.now() - t; const rt = (res.perfStats && res.perfStats.ruleTimings) || {}; return { tot, top: Object.entries(rt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + '=' + Math.round(v)), errs: res.checksResults.filter(c => c.error).map(c => c.ruleId + ':' + String(c.error).slice(0, 80)), sel: Object.fromEntries(res.checksResults.filter(c => ['click-handler-keyboard-operable', 'mouse-only-event-handlers', 'widget-keyboard-focusable', 'live-region-announcements', 'moving-content-pausable'].includes(c.ruleId)).map(c => [c.ruleId, c.outcome + '/' + c.occurrences.length])) }; });
  console.log(`${name} n=${n} total=${Math.round(r.tot)}ms ${r.top.join(' ')} ${JSON.stringify(r.sel)}${r.errs.length ? ' ERR ' + r.errs.join(';') : ''}`);
  await ctx.close(); return r;
}
const P = (body) => `<!doctype html><html lang="en"><head><title>Scale</title></head><body style="background:#fff"><main><h1>Scale</h1>${body}</main></body></html>`;
const only = process.argv[2];
const NS = [1000, 4000, 10000];
const cases = {
  'listeners: n divs with click via addEventListener (hook)': (n) => [P(`<div id="w">${rep(n, (i) => `<div class="c" role="button" tabindex="0">B${i}</div>`)}</div><script>for (const d of document.querySelectorAll('.c')) d.addEventListener('click', () => {});</script>`), { init: core.listenerHookScript() }],
  'listeners: n divs with click, no hook': (n) => [P(`<div id="w">${rep(n, (i) => `<div class="c" role="button" tabindex="0">B${i}</div>`)}</div><script>for (const d of document.querySelectorAll('.c')) d.addEventListener('click', () => {});</script>`), {}],
  'listeners: n spans click+keydown, plain spans (hook)': (n) => [P(`${rep(n, (i) => `<span class="c">S${i}</span>`)}<script>for (const d of document.querySelectorAll('.c')) { d.addEventListener('click', () => {}); d.addEventListener('mousedown', () => {}); }</script>`), { init: core.listenerHookScript() }],
  'listeners: one delegated on body + n children (hook)': (n) => [P(`${rep(n, (i) => `<span class="c" role="link">S${i}</span>`)}<script>document.body.addEventListener('click', () => {});</script>`), { init: core.listenerHookScript() }],
  'live-region hook: log gets n entries': (n) => [P(`<div role="log" aria-live="polite" id="log"></div>`), { init: core.liveRegionHookScript(), after: `(() => { const log = document.getElementById('log'); for (let i = 0; i < ${n}; i++) { const p = document.createElement('p'); p.textContent = 'Message ' + i; log.appendChild(p); } })()` }],
  'live-region hook: n regions filled': (n) => [P(rep(n, (i) => `<div aria-live="polite" id="r${i}"></div>`)), { init: core.liveRegionHookScript(), after: `(() => { for (let i = 0; i < ${n}; i++) document.getElementById('r' + i).textContent = 'Saved ' + i; })()` }],
  'moving: n animated elements': (n) => [P(`<style>@keyframes m{from{transform:translateX(0)}to{transform:translateX(50px)}}.a{animation:m 10s infinite}</style>${rep(n, (i) => `<span class="a">M${i}</span> `)}`), {}],
  'grid table n cells': (n) => { const s = Math.sqrt(n) | 0; return [P(`<table role="grid" aria-label="g">${rep(s, (r) => '<tr>' + rep(s, (c) => `<td tabindex="-1">${r},${c}</td>`) + '</tr>')}</table>`), {}]; },
};
for (const [k, mk] of Object.entries(cases)) { if (only && !k.includes(only)) continue; for (const n of NS) { const [html, o] = mk(n); await time(k, n, html, o); } }
await b.close();
