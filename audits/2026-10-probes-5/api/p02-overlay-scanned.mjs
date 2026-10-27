// Does a scan run with highlight()/inspect() overlays on the page give a different result?
// And does run()/inspect() move focus, scroll, or change selection?
import { launch, open } from './h.mjs';
const html = `<!doctype html><html lang=en><head><title>t</title><style>body{margin:0}.r{position:absolute;right:0;top:300px}</style></head><body>
<header><nav aria-label="Main"><a href="/a">A</a></nav></header>
<main><h1>Title</h1><h3>skip</h3><img src="x.png"><button></button><input id=i><div role=button tabindex=0 onclick="1">x</div>
<a class=r href="#">${'here'}</a><p style="color:#777;background:#fff">low contrast text</p>
<div style="height:3000px"></div><input id=last></main></body></html>`;
const b = await launch();
for (const vw of [{ width: 1280, height: 800 }, { width: 320, height: 640 }]) {
  const { page, ctx } = await open(b, html, { viewport: vw });
  const sig = (r) => r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + (c.occurrences || []).length).join('|');
  await page.evaluate(() => { document.getElementById('last').focus(); window.scrollTo(0, 500); });
  const s0 = await page.evaluate(() => ({ a: document.activeElement.id, y: scrollY, x: scrollX, sw: document.documentElement.scrollWidth }));
  const base = await page.evaluate(async () => JSON.parse(JSON.stringify(await a11ycore.run())));
  const s1 = await page.evaluate(() => ({ a: document.activeElement.id, y: scrollY, x: scrollX, sw: document.documentElement.scrollWidth }));
  console.log(vw.width, 'before run', s0, 'after run', s1);
  const n = await page.evaluate((r) => a11ycore.highlight(r), base);
  const s2 = await page.evaluate(() => ({ a: document.activeElement.id, y: scrollY, x: scrollX, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(vw.width, 'highlight marked', n, 'after highlight', s2);
  const withOverlay = await page.evaluate(async () => JSON.parse(JSON.stringify(await a11ycore.runa11yCoreInPageAsync(location.href, null, {}, null))));
  const a = sig(base).split('|'), c = sig(withOverlay).split('|');
  console.log(vw.width, 'diff with highlight overlay:', a.filter((x) => !c.includes(x)), '->', c.filter((x) => !a.includes(x)));
  for (const k of ['headings', 'landmarks', 'names', 'focus-order']) {
    await page.evaluate((k) => a11ycore.inspect(k), k);
    const s3 = await page.evaluate(() => ({ a: document.activeElement.id, y: scrollY, sw: document.documentElement.scrollWidth }));
    const w = await page.evaluate(async () => JSON.parse(JSON.stringify(await a11ycore.runa11yCoreInPageAsync(location.href, null, {}, null))));
    const d = sig(w).split('|');
    console.log(vw.width, 'inspect', k, s3, 'diff:', a.filter((x) => !d.includes(x)), '->', d.filter((x) => !a.includes(x)));
  }
  await ctx.close();
}
await b.close();
