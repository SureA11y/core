const { cases, close } = require('./multi');
const { shot, ratio } = require('./h');
(async () => {
const L = [
 ['light-dark both, prefers dark', `<html style="color-scheme:light dark"><body><p style="color:light-dark(#333,#444)">LD text</p></body></html>`, {colorScheme:'dark'}],
 ['light-dark both, prefers light', `<html style="color-scheme:light dark"><body><p style="color:light-dark(#333,#444)">LD text</p></body></html>`, {colorScheme:'light'}],
 ['meta dark only, no colors', `<meta name="color-scheme" content="dark"><p>Default text</p><a href="#">link</a>`, {colorScheme:'light'}],
 ['meta light dark, link default', `<meta name="color-scheme" content="light dark"><p>Default <a href="#x">visited link</a></p>`, {colorScheme:'dark'}],
 ['color-scheme on element only', `<div style="color-scheme:dark;background:Canvas"><p style="color:#555">Inner dark</p></div>`, {colorScheme:'light'}],
 ['color-scheme dark element no bg', `<div style="color-scheme:dark"><p style="color:#555">Inner dark, no bg</p></div>`, {colorScheme:'dark'}],
 ['prefers-color-scheme media bg', `<style>@media (prefers-color-scheme: dark){body{background:#000}}</style><p style="color:#333">Media</p>`, {colorScheme:'dark'}],
 ['system color canvastext in dark', `<html style="color-scheme:dark"><p style="color:GrayText">Gray</p></html>`, {colorScheme:'dark'}],
];
await cases(L);
for (const [l, h, o] of [L[3], L[4], L[5], L[7]]) {
  const r = await shot(h, Object.assign({ eval: () => { const p = document.querySelector('p, a'); const s = getComputedStyle(p); return [s.color, s.backgroundColor, getComputedStyle(document.documentElement).backgroundColor]; } }, o));
  console.log(l, JSON.stringify(r.ev));
}
await close();
})();
