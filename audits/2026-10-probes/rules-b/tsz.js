const h = require('./h.js');
const R = ['target-size-minimum'];
const B = (s, t='x') => `<button style="width:20px;height:20px;padding:0;border:0;margin:0;${s}">${t}</button>`;
const cases = {
  gap4_center24: `<div style="display:flex;gap:4px">${B('')}${B('')}</div>`,
  gap3_center23: `<div style="display:flex;gap:3px">${B('')}${B('')}</div>`,
  gap3_9: `<div style="display:flex;gap:3.9px">${B('')}${B('')}</div>`,
  icon16_pitch24: `<div style="display:flex;gap:8px">${B('width:16px;height:16px')}${B('width:16px;height:16px')}</div>`,
  small_next_to_big: `<div style="display:flex;gap:2px">${B('width:16px;height:16px')}<button style="width:200px;height:60px">Big</button></div>`,
  inline_link: `<p>Read the <a href="#">terms</a> and <a href="#">privacy</a> policy for details on this.</p>`,
  inline_link_tiny_font: `<p style="font-size:10px">Read <a href="#">a</a> <a href="#">b</a> text after</p>`,
  rotate45: `<div style="padding:40px">${B('transform:rotate(45deg)')}</div>`,
  scale_half: `<div style="padding:40px">${B('width:40px;height:40px;transform:scale(.5)')}<button style="margin-left:2px;width:40px;height:40px;transform:scale(.5)">y</button></div>`,
  clipped_visible_part: `<div style="width:10px;height:10px;overflow:hidden;display:inline-block"><button style="width:40px;height:40px;padding:0">x</button></div><div style="width:10px;height:10px;overflow:hidden;display:inline-block"><button style="width:40px;height:40px;padding:0">y</button></div>`,
  display_contents_link: `<a href="#" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></a><a href="#" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></a>`,
  overlapping: `<div style="position:relative;height:60px"><button style="position:absolute;left:0;top:0;width:30px;height:30px">a</button><button style="position:absolute;left:10px;top:10px;width:30px;height:30px">b</button></div>`,
  checkbox_native: `<input type=checkbox><input type=checkbox>`,
  checkbox_label: `<label><input type=checkbox style="appearance:none;width:12px;height:12px;border:1px solid"> Accept terms</label><label><input type=checkbox style="appearance:none;width:12px;height:12px;border:1px solid"> Other</label>`,
  exact24: `<button style="width:24px;height:24px;padding:0">a</button>`,
  w2399: `<button style="width:23.99px;height:30px;padding:0">a</button><button style="width:23.99px;height:30px;padding:0">b</button>`,
  hidden_input_label: `<label style="display:inline-block;width:30px;height:30px"><input type=radio style="position:absolute;opacity:0;width:1px;height:1px;margin:0">A</label><label style="display:inline-block;width:30px;height:30px"><input type=radio style="position:absolute;opacity:0;width:1px;height:1px;margin:0">B</label>`,
};
(async () => {
  for (const dpr of [1, 2]) for (const [k, body] of Object.entries(cases)) {
    const r = (await h.scan(body, { rules: R, dpr }))[R[0]];
    console.log(`dpr${dpr}`, k.padEnd(22), r.outcome, r.occ.map(o => `${o.sel}:${o.rc}${o.d && o.d.metrics ? '(' + [o.d.metrics.widthPx, o.d.metrics.heightPx, o.d.metrics.centerDistancePx].join('/') + ')' : ''}`).join('; '), r.margin ? `m=${r.margin.value}/${r.margin.threshold} n=${r.margin.measuredCount} ${JSON.stringify(r.margin.context)}` : '');
  }
  await h.close();
})();
