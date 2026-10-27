import { launch } from './probe.mjs';
import { decodePNG, regionStats } from './png.mjs';
const b = await launch();
for (const css of ['body{background:#222;color:#fff} #a{background:transparent;color:#fff}', '#a{background:#f8f8f8}', '#a{background:#ddd}', '']) {
  const p = await b.newPage();
  await p.setContent(`<style>body{font:16px Arial} ${css}</style><label>N <input id=a placeholder="Your name"></label>`);
  const box = await (await p.$('#a')).boundingBox();
  const img = decodePNG(await p.screenshot({ clip: { x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8 } }));
  console.log(css, regionStats(img, 0, 0, 1e5, 1e5), await p.$eval('#a', (e) => getComputedStyle(e, '::placeholder').color));
  await p.close();
}
await b.close();
