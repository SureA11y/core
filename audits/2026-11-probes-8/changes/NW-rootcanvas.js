// contrast.rootCanvasFallback syntax check under strictOptions
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><p>Text</p></main></body></html>';
for (const v of ['#fff', 'white', 'rgb(0 0 0)', 'rgb(0 0 0 1)', 'rgb(0,0,0,1)', 'rgb(0 0 0 / 1)', 'rgba(0 0 0 / 100%)', 'hsl(0 0% 100%)', 'hsl(0deg 0% 100% 1)', 'Canvas', 'CanvasText', 'oklch(1 0 0)', 'color(srgb 1 1 1)', 'rgb(none none none)', 'rgb(from white r g b)', 'rgb(0 0 0 / 1 / 1)', 'rgb(0,0,0 / 1)', '#ffff', '#ffffffff', 'rgb(255 255 255 / 2)', 'rgb(1e2 0 0)', 'transparent']) {
  let out;
  try { const r = runa11yCoreOnHtml(html, { runOnly: ['contrast-minimum'], engineOptions: { strictOptions: true, contrast: { rootCanvasFallback: v } } }); out = 'ok ' + r.checksResults[0].outcome; } catch (e) { out = 'THROW ' + e.message.slice(0, 90); }
  console.log(v.padEnd(24), out);
}
