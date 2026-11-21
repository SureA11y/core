const { cases, close } = require('./multi');
(async () => {
await cases([
 ['shadow-decor good fill', `<p style="color:#000;background:#fff;text-shadow:2px 2px 2px #ccc">Text shadow</p>`],
 ['blend difference', `<div style="background:#fff"><p style="color:#fff;mix-blend-mode:difference">Blend text</p></div>`],
 ['backdrop blur header', `<div style="background:#000;height:300px"><header style="position:absolute;top:0;left:0;right:0;background:rgba(255,255,255,.6);backdrop-filter:blur(10px)"><p style="color:#666">Header text</p></header></div>`],
 ['oklch color', `<p style="color:oklch(0.7 0 0);background:#fff">OKLCH text</p>`],
 ['color-mix', `<p style="color:color-mix(in srgb, #000 40%, #fff);background:#fff">Mix text</p>`],
 ['display-p3', `<p style="color:color(display-p3 0.55 0.55 0.55);background:#fff">P3 text</p>`],
 ['zoom 2 small', `<p style="zoom:2;color:#888;background:#fff;font-size:12px">Zoomed</p>`],
 ['scale 2 small', `<p style="transform:scale(2);transform-origin:0 0;color:#888;background:#fff;font-size:12px">Scaled</p>`],
 ['invert html', `<html style="filter:invert(1)"><body style="background:#fff"><p style="color:#767676">Invert</p></body></html>`],
 ['bg-clip text gradient', `<p style="background:linear-gradient(#eee,#ddd);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:20px">Gradient text</p>`],
 ['transparent + shadow 0 0 0', `<p style="color:transparent;text-shadow:0 0 0 #ccc;background:#fff">Shadow fill</p>`],
 ['video with bg', `<div style="position:relative;background:#000"><video style="width:300px;height:100px;display:block"></video><p style="position:absolute;top:0;color:#fff">Over video</p></div>`],
 ['content-visibility offscreen', `<div style="height:3000px"></div><section style="content-visibility:auto;contain-intrinsic-size:auto 100px"><p style="color:#aaa">Hidden till scroll</p></section>`],
 ['ancestor opacity', `<div style="opacity:.5"><p style="color:#000;background:#fff">Half</p></div>`],
 ['webkit-text-fill', `<p style="color:#000;-webkit-text-fill-color:#aaa;background:#fff">Fill</p>`],
]);
await close();
})();
