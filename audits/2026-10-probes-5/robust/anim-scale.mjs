// Where does a scan of a page with N CSS animations spend its time (Chromium)?
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const variant = process.argv[2] || 'transform';
const css = { transform: '@keyframes m{from{transform:translateX(0)}to{transform:translateX(50px)}}.a{animation:m 10s infinite}', opacity: '@keyframes m{from{opacity:.2}to{opacity:1}}.a{animation:m 1s infinite}', shimmer: '@keyframes m{from{background-position:0 0}to{background-position:100px 0}}.a{animation:m 1.5s infinite;background:linear-gradient(90deg,#eee,#ddd)}' }[variant];
for (const n of (process.argv[3] || '500,1000,2000,4000').split(',').map(Number)) {
  for (const runOnly of [null, ['moving-content-pausable'], ['img-alt-present']]) {
    const p = await b.newPage();
    await p.setContent(`<!doctype html><html lang="en"><head><title>Anim</title><style>${css}</style></head><body style="background:#fff"><main><h1>A</h1>${rep(n, (i) => `<span class="a">M${i}</span> `)}</main></body></html>`);
    await p.addScriptTag({ content: BUNDLE });
    const r = await p.evaluate((ro) => { const t = performance.now(); const res = window.a11ycore.runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, ro); const tot = performance.now() - t; const ps = res.perfStats || {}; const rt = ps.ruleTimings || {}; const sum = Object.values(rt).reduce((a, b) => a + b, 0); return { tot, sum, keys: Object.keys(ps).filter(k => typeof ps[k] === 'number').map(k => k + '=' + Math.round(ps[k])).join(' ') }; }, runOnly);
    console.log(`${variant} n=${n} runOnly=${runOnly ? runOnly.join() : 'all'} total=${Math.round(r.tot)} ruleSum=${Math.round(r.sum)} ${r.keys}`);
    await p.close();
  }
}
await b.close();
