'use strict';
// Fixed cost: scans of a near-empty page, first and second scan in the same page, per build.
const fs = require('fs'); const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const B = ['r11', 'r8', 'v117']; const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = {};
  for (let rep = 0; rep < 7; rep++) for (const b of B) {
    const p = await browser.newPage();
    await p.setContent('<!doctype html><html lang=en><head><title>E</title></head><body><main><h1>E</h1><p>Hello <a href="/x">link</a></p><label>Name <input></label></main></body></html>');
    await p.addScriptTag({ path: `/home/user/core-${b}/surea11y.browser.js` });
    const r = await p.evaluate(async () => { const out = []; for (let i = 0; i < 2; i++) { const t = performance.now(); const r = await window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null); out.push({ total: performance.now() - t, warm: r.perfStats.warmUpMs, rt: r.perfStats.ruleTimings }); } return out; });
    (res[b] = res[b] || []).push(r); await p.close();
  }
  for (const b of B) {
    const f = res[b].map((x) => x[0]), s = res[b].map((x) => x[1]);
    const sum = (x) => Object.values(x.rt).reduce((a, c) => a + c, 0);
    console.log(`${b} first: total=${med(f.map((x) => x.total)).toFixed(0)} rules=${med(f.map(sum)).toFixed(0)} warm=${med(f.map((x) => x.warm)).toFixed(1)} | second: total=${med(s.map((x) => x.total)).toFixed(0)} rules=${med(s.map(sum)).toFixed(0)}`);
  }
  const ids = Object.keys(res.r11[0][0].rt);
  const d = ids.map((id) => [id, ...B.map((b) => med(res[b].map((x) => x[0].rt[id] || 0)))]).sort((a, c) => (c[1] - c[2]) - (a[1] - a[2]));
  console.log('first scan, rules costing most more than r8:', d.slice(0, 10).map((r) => `${r[0]} ${r.slice(1).map((x) => x.toFixed(1)).join('/')}`).join(' | '));
  console.log('top first-scan rules r11:', d.slice().sort((a, c) => c[1] - a[1]).slice(0, 10).map((r) => `${r[0]} ${r.slice(1).map((x) => x.toFixed(1)).join('/')}`).join(' | '));
  await browser.close();
})();
