// contrast: an inset box-shadow painting the background (overlay / autofill trick) is ignored
const { run, show, close, shot, ratio } = require('./h');
(async () => {
 const R = ['contrast-minimum','contrast-computable'];
 const A = `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px;width:300px"><p id=t style="color:#333;font-size:16px;margin:0">Dark text on an inset shadow</p></div>`;
 const B = `<div style="box-shadow:inset 0 0 0 1000px #000;padding:10px;width:300px"><p id=t style="color:#fff;font-size:16px;margin:0">White text on an inset shadow</p></div>`;
 const Cc = `<a href="#" style="display:block;width:300px;height:120px;background:#fff;box-shadow:inset 0 0 0 100vmax rgba(0,0,0,.6)"><span id=t style="color:#555">Card title over a darkening overlay</span></a>`;
 for (const [l, h] of [['dark text', A], ['white text', B], ['card overlay rgba', Cc]]) {
  const r = await run(h, R); show(l, r, true);
  const s = await shot(h, { sample: [[12, 12], [300, 15]] , eval: () => { const t = document.getElementById('t'); const rc = t.getBoundingClientRect(); return [rc.left, rc.top, rc.width, rc.height]; } });
  console.log('   painted bg at (12,12):', s.px[0], 'text color sample', s.px[1], 'rect', s.ev);
 }
 await close();
})();
