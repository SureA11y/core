import { launch, run } from './probe.mjs';
const b = await launch();
for (const app of ['base-select', 'auto']) {
const o = await run(b, `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} #a,#a::picker(select){appearance:${app}} #a{color:#aaa}</style></head><body><select id=a aria-label=x><option>First choice</option><option>Second</option></select></body></html>`, { rules: ['contrast-minimum'] });
console.log(app, o.raw.checksResults[0].occurrences.map((x) => x.summary + ' ' + JSON.stringify(x.data?.details?.metrics)));
}
await b.close();
