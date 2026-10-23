import { launch, run, show } from './probe.mjs';
const b = await launch();
const o = await run(b, `<html><body style="background:#fff"><p id=a style="color:#999">Hello world grey</p><p id=b style="color:#767676">ok text</p></body></html>`, { rules: ['contrast-minimum'], sample: ['#a', '#b'] });
console.log(show(o));
const c = o.raw.checksResults.find((c) => c.ruleId === 'contrast-minimum');
console.log(JSON.stringify(c, null, 1).slice(0, 3000));
await b.close();
