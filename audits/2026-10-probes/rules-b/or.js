const h = require('./h.js'); const { jscan } = require('./j.js');
const R = ['css-orientation-lock'];
const css = {
  rot90_portrait_html: '@media (orientation:portrait){html{transform:rotate(90deg)}}',
  rot_turn: '@media (orientation:portrait){body{transform:rotate(.25turn)}}',
  rot_rad: '@media (orientation:portrait){body{transform:rotate(1.5708rad)}}',
  rotate_prop: '@media (orientation:portrait){body{rotate:90deg}}',
  matrix: '@media (orientation:portrait){body{transform:matrix(0,1,-1,0,0,0)}}',
  rot180: '@media (orientation:portrait){body{transform:rotate(180deg)}}',
  rot5_small_el: '@media (orientation:portrait){.x{transform:rotate(90deg)}}',
  in_layer: '@layer a{@media (orientation:portrait){body{transform:rotate(90deg)}}}',
  in_supports: '@supports (display:grid){@media (orientation:landscape){body{transform:rotate(-90deg)}}}',
  aspect_ratio: '@media (min-aspect-ratio:1/1){body{transform:rotate(90deg)}}',
  rot_display_none_unrelated: '@media (orientation:portrait){.y{display:none}}',
  rot_on_icon: '@media (orientation:landscape){.icon{transform:rotate(90deg)}}',
};
(async () => {
  for (const [k, c] of Object.entries(css)) {
    const body = `<style>${c}</style><p>Text</p><span class=x>s</span><span class=icon style="display:inline-block;width:10px;height:10px">></span>`;
    const a = (await h.scan(body, { rules: R, viewport: { width: 400, height: 800 } }))[R[0]]; const b = jscan(body, { rules: R })[R[0]];
    console.log(k.padEnd(26), 'chromium', a.outcome, a.occ.map(o=>o.rc).join(','), '| jsdom', b.outcome, b.occ.map(o=>o.rc).join(','));
  }
  await h.close();
})();
