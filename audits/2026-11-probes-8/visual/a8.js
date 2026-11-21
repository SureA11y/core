// contrast: a mask-image on the text or an ancestor fades the text, but the ratio ignores it
const { run, show, close, shot, ratio } = require('./h');
(async () => {
 const R = ['contrast-minimum','contrast-computable'];
 const A = `<div style="mask-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2));-webkit-mask-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))"><p style="color:#000;font-size:40px;margin:0">MMMM</p></div>`;
 const B = `<p style="color:#000;font-size:40px;margin:0;mask-image:linear-gradient(transparent 0 0);">MMMM masked out</p>`;
 const C = `<div style="height:110px;overflow:hidden;mask-image:linear-gradient(#000 40%,transparent 95%)"><p style="color:#333;margin:0 0 4px;font-size:16px;line-height:24px">The opening line of a long story excerpt</p><p style="color:#333;margin:0 0 4px;line-height:24px">and the second line that follows it on</p><p style="color:#333;margin:0 0 4px;line-height:24px">a third line fading out of view</p><p style="color:#333;margin:0;line-height:24px">fourth line almost gone</p></div>`;
 for (const [l, h, pts] of [['20% mask', A, [[12, 20], [200, 20]]], ['masked out', B, [[14, 22]]], ['read-more fade', C, [[12, 12]]]]) {
  show(l, await run(h, R), false);
  const s = await shot(h, { file: '/tmp/surea11y-audit/r8/visual/' + l.replace(/\W/g,'') + '.png', eval: () => 0 });
 }
 // darkest pixel in the 20% case
 const s = await shot(A, { sample: Array.from({length: 60}, (_, i) => [8 + i * 2, 30]) });
 const dark = s.px.reduce((m, p) => p[0] < m[0] ? p : m, [255,255,255]);
 console.log('darkest pixel of the 20%-masked black text:', dark, 'ratio vs white', ratio(dark.slice(0,3), [255,255,255]).toFixed(2));
 await close();
})();
