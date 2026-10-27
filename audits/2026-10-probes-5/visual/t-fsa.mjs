import { launch } from './probe.mjs';
import { decodePNG } from './png.mjs';
const b = await launch();
const p = await b.newPage();
await p.setContent(`<style>body{font-family:Arial;margin:0} p{margin:0;line-height:40px;color:#000}</style><p id=a style="font-size:24px;font-size-adjust:0.3">Hxxxxx</p><p id=b style="font-size:24px">Hxxxxx</p><p id=c style="font-size:14px">Hxxxxx</p>`);
for (const id of ['a', 'b', 'c']) {
  const box = await (await p.$('#' + id)).boundingBox();
  const img = decodePNG(await p.screenshot({ clip: box }));
  let top = 1e9, bot = -1, right = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.at(x, y)[0] < 128) { top = Math.min(top, y); bot = Math.max(bot, y); right = Math.max(right, x); }
  console.log(id, 'ink height (cap H)', bot - top + 1, 'ink width', right + 1, 'computed', await p.$eval('#' + id, (e) => getComputedStyle(e).fontSize));
}
await b.close();
