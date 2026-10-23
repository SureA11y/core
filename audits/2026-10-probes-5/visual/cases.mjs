// Runs a module's exported cases: [{ name, html, rules, sample, ... }]
import { launch, run, show } from './probe.mjs';
const mod = await import(process.argv[2]);
const only = process.argv[3];
const b = await launch();
for (const c of mod.default) {
  if (only && !c.name.includes(only)) continue;
  try { const o = await run(b, c.html, c); console.log('=== ' + c.name + '\n' + show(o)); if (process.env.SUM) for (const r of o.res) for (const x of r.occ) if (x.tier !== 'pass') console.log('   ' + (x.sum || '').slice(0, 260)); }
  catch (e) { console.log('=== ' + c.name + ' ERROR ' + e.message); }
}
await b.close();
