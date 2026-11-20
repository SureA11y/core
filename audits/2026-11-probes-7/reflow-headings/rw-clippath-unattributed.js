// RW: content hidden by clip/clip-path that widens the page -> UNATTRIBUTED fail, while visibility:hidden passes
const h = require('./harness');
const D = '<!doctype html><html><head><meta charset=utf-8></head><body><p>Page text</p>';
const panel = (style) => `<div style="position:absolute;top:0;left:0;width:600px;${style}">Panel text <a href="#">Link</a></div></body></html>`;
(async () => {
  for (const [name, st] of [['visibility:hidden', 'visibility:hidden'], ['clip-path:inset(50%)', 'clip-path:inset(50%)'], ['clip-path:inset(0 0 100% 0)', 'clip-path:inset(0 0 100% 0)'], ['clip:rect(0 0 0 0)', 'clip:rect(0 0 0 0)'], ['clip-path:inset(10%) (visible, control)', 'clip-path:inset(10%)']]) {
    for (let i = 0; i < 2; i++) {
      const r = await h.runChromium(D + panel(st), 'reflow-horizontal-scroll', { after: () => document.scrollingElement.scrollWidth });
      console.log(name.padEnd(42), 'scrollWidth=' + r.extra, r.outcome, r.occ.map(o => o.code + '@' + o.sel).join(','));
    }
  }
  await h.close();
})();
