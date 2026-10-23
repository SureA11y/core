import { launch, run } from './probe.mjs';
import { decodePNG } from './png.mjs';
const b = await launch();
for (const css of ['color:#767676', 'color:#767676;padding:6px;font-size:16px', 'color:#767676;width:200px', 'color:#767676;border-radius:4px', 'color:#767676;background-color:#efefef', 'color:#767676;outline:2px solid red']) {
  const html = `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} #a{${css}}</style></head><body><label>Country <select id=a><option>First choice</option><option>Second</option></select></label></body></html>`;
  const p = await b.newPage(); await p.setContent(html);
  const box = await (await p.$('#a')).boundingBox();
  const img = decodePNG(await p.screenshot({ clip: { x: box.x + box.width / 2, y: box.y + 3, width: 1, height: 1 } }));
  const px = img.at(0, 0); await p.close();
  const o = await run(b, html, { rules: ['contrast-minimum'] });
  console.log(css.padEnd(45), 'painted bg', px.join(','), '|', o.res[0].outcome, o.res[0].occ.filter((x) => x.ratio).map((x) => x.ratio.toFixed(2) + ' ' + x.bg).join());
}
await b.close();
