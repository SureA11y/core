import { launch, run } from './probe.mjs';
const mod = await import('./c-spacing.mjs');
const b = await launch();
for (const c of mod.default.filter((c) => /TS5|TS8|TS9/.test(c.name))) {
  const o = await run(b, c.html, c);
  const r = o.raw.checksResults[0];
  console.log(c.name, r.outcome, JSON.stringify(r.data || r.occurrences.map((x) => x.summary)).slice(0, 400));
}
await b.close();
