// Applies WCAG 1.4.12 spacing and counts ink rows/glyph bands painted inside #a, with and without zoom.
import { launch } from './probe.mjs';
import { decodePNG } from './png.mjs';
const b = await launch();
const SP = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p{margin-bottom:2em !important}';
const pages = {
  noZoom: '<style>body{font:16px/1.2 Arial;margin:8px} #a{width:200px;height:40px;overflow:hidden}</style><div id=a>Two lines only of text here ok</div>',
  zoom08: '<style>html{zoom:.8} body{font:16px/1.2 Arial;margin:8px} #a{width:200px;height:40px;overflow:hidden}</style><div id=a>Two lines only of text here ok</div>',
};
for (const [k, html] of Object.entries(pages)) {
  for (const sp of [false, true]) {
    const p = await b.newPage();
    await p.setContent(html + (sp ? `<style>${SP}</style>` : '') + '<div id=full style="position:absolute;top:300px;left:8px;width:200px">' + 'Two lines only of text here ok' + '</div>');
    // full text height for reference: same box without clipping
    const box = await (await p.$('#a')).boundingBox();
    const img = decodePNG(await p.screenshot({ clip: box }));
    const bands = []; let inBand = false;
    for (let y = 0; y < img.h; y++) { let ink = false; for (let x = 0; x < img.w; x++) if (img.at(x, y)[0] < 160) { ink = true; break; } if (ink && !inBand) bands.push([y]); if (!ink && inBand) bands[bands.length - 1].push(y); inBand = ink; }
    const words = await p.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('a').firstChild); return [...r.getClientRects()].map((x) => `${x.top.toFixed(1)}-${x.bottom.toFixed(1)}`); });
    console.log(k, sp ? 'spacing' : 'plain  ', 'box', box.height.toFixed(1), 'ink bands', JSON.stringify(bands), 'line rects', words.join(' '));
    await p.close();
  }
}
await b.close();
