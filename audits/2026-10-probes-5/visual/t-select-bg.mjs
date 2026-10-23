import { launch, run, show } from './probe.mjs';
import { decodePNG, regionStats, hex } from './png.mjs';
const b = await launch();
for (const css of ['', '#a{color:#767676}', '#a{color:#aaa}', '#a{color:#000;border:1px solid #000}', '#a{color:#767676;border-radius:0}']) {
  const html = `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} ${css}</style></head><body><label>L <select id=a><option>First choice</option><option>Second</option></select></label></body></html>`;
  const page = await b.newPage();
  await page.goto('data:text/html,' + encodeURIComponent(html));
  const info = await page.$eval('#a', (e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, color: cs.color, ap: cs.appearance, border: cs.borderTopColor }; });
  const box = await (await page.$('#a')).boundingBox();
  const img = decodePNG(await page.screenshot({ clip: { x: box.x + 3, y: box.y + 3, width: box.width - 25, height: box.height - 6 } }));
  console.log(JSON.stringify(css), JSON.stringify(info), regionStats(img, 0, 0, 1e5, 1e5));
  await page.close();
  const o = await run(b, html, { rules: ['contrast-minimum'] });
  console.log('   ', show(o));
}
await b.close();
