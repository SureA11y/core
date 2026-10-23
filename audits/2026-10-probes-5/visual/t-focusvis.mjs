// Focus each link by Tab and report whether its box is inside the viewport and non-empty after focus.
import { launch } from './probe.mjs';
const mod = await import(process.argv[3] || './c-hfocus.mjs');
const b = await launch();
for (const c of mod.default) {
  if (process.argv[2] && !process.argv[2].split(',').some((n) => c.name.startsWith(n + ' '))) continue;
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  await p.setContent(c.html);
  const out = [];
  for (let i = 0; i < 4; i++) {
    await p.keyboard.press('Tab');
    out.push(await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const vis = r.width > 0.5 && r.height > 0.5 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight; const hit = vis ? document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))) : null; return `${e.textContent.trim()}:${vis ? 'inView' : 'OUT'}${vis && hit !== e && !e.contains(hit) ? '(covered/clipped)' : ''} [${r.left | 0},${r.top | 0} ${r.width | 0}x${r.height | 0}] scroll=${scrollX},${scrollY}`; }));
  }
  console.log(c.name, '\n   ', out.join('\n    '));
  await p.close();
}
await b.close();
