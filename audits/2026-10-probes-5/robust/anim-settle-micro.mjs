// Microbenchmark of settleAnimations' pattern in Chromium: interleaved read/write per animation vs reads first, then writes.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
for (const n of [1000, 2000, 4000]) {
  const p = await b.newPage();
  await p.setContent(`<style>@keyframes m{from{transform:translateX(0)}to{transform:translateX(50px)}}.a{animation:m 10s infinite}</style>${rep(n, (i) => `<span class="a">M${i}</span> `)}`);
  const r = await p.evaluate(() => {
    const out = {};
    let anims = document.getAnimations(); let t = performance.now();
    const saved = [];
    for (const a of anims) { if (a.playState !== 'running') continue; const ct = a.currentTime; const tm = a.effect.getComputedTiming(); saved.push([a, ct]); a.currentTime = Number.isFinite(tm.endTime) ? tm.endTime : 0; }
    out.interleaved = performance.now() - t; for (const [a, ct] of saved) a.currentTime = ct;
    anims = document.getAnimations(); t = performance.now();
    const plan = [];
    for (const a of anims) { if (a.playState !== 'running') continue; plan.push([a, a.currentTime, a.effect.getComputedTiming()]); }
    for (const [a, , tm] of plan) a.currentTime = Number.isFinite(tm.endTime) ? tm.endTime : 0;
    out.batched = performance.now() - t; for (const [a, ct] of plan) a.currentTime = ct;
    return out;
  });
  console.log(`n=${n} interleaved=${Math.round(r.interleaved)}ms batched=${Math.round(r.batched)}ms`);
  await p.close();
}
await b.close();
