// Cost of the listener hook with 100k listeners (add + remove), and of the live-region hook with 5k region updates.
import { open, serve, HOOKS } from './h.mjs';
const b = await open();
const js = `(() => { const els = []; for (let i = 0; i < 20000; i++) els.push(document.createElement('div'));
  const f = () => {}; const t0 = performance.now();
  for (let i = 0; i < 100000; i++) els[i % 20000].addEventListener(['click','keydown','mouseover','scroll','focus'][i % 5], i % 7 ? f : () => {});
  const t1 = performance.now();
  for (let i = 0; i < 100000; i++) els[i % 20000].removeEventListener(['click','keydown','mouseover','scroll','focus'][i % 5], f);
  const t2 = performance.now();
  const s = document.createElement('div'); s.setAttribute('role','status'); document.body.append(s);
  return [Math.round(t1 - t0), Math.round(t2 - t1)]; })()`;
const live = `new Promise(async (res) => { const s = document.getElementById('s'); const t0 = performance.now(); for (let i = 0; i < 5000; i++) { s.textContent = 'n' + i; await new Promise(r => setTimeout(r, 0)); } res(Math.round(performance.now() - t0)); })`;
for (const hooks of [[], ['listener', 'live']]) {
  for (let rep = 0; rep < 2; rep++) {
    const ctx = await b.newContext(); const page = await ctx.newPage();
    for (const h of hooks) await page.addInitScript({ content: HOOKS[h] });
    await page.goto(serve('<div id=s role=status></div>'));
    const r = await page.evaluate(js);
    const l = await page.evaluate(live);
    const mem = await page.evaluate(() => { const reg = window[Symbol.for('surea11y.liveRegions')]; return reg ? [reg.announcements.length, reg.dropped.announcements] : null; });
    console.log(hooks.join('+') || 'none', 'add/remove ms', r, ' 5000 live updates ms', l, ' live record [kept, dropped]', mem);
    await ctx.close();
  }
}
await b.close();
