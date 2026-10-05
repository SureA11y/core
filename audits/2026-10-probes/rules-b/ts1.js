const h = require('./h.js');
const R = ['text-spacing-content-loss'];
const lorem = 'The quick brown fox jumps over the lazy dog again and again';
const cases = {
  fixed_h_partial_before: `<div style="height:40px;line-height:20px;overflow:hidden;width:200px">${lorem} ${lorem}</div>`,
  fixed_h_fits_before: `<div style="height:40px;line-height:20px;overflow:hidden;width:200px">Short two line text that wraps here</div>`,
  line_clamp: `<p style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:200px;line-height:20px;margin:0">${lorem} ${lorem}</p>`,
  fixed_btn_nowrap: `<button style="width:80px;height:30px;overflow:hidden;white-space:nowrap;padding:0">Subscribe now</button>`,
  fixed_btn_visible: `<button style="width:80px;height:24px;padding:0;white-space:nowrap">Subscribe now ok</button>`,
  scroll_container: `<div style="height:40px;overflow:auto;width:200px;line-height:20px">Two lines of text that wraps here ok</div>`,
  ellipsis: `<div style="width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lorem}</div>`,
  ellipsis_fits: `<div style="width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Short label text</div>`,
  abs_child_escapes: `<div style="position:relative"><div style="overflow:hidden;height:30px;width:150px"><span style="position:absolute;top:0;left:0;white-space:nowrap">Absolutely placed label text</span></div></div>`,
  near_edge_1_9: `<div style="height:20px;overflow:hidden;width:300px;font-size:16px;line-height:normal">Single line</div>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    const t0 = Date.now();
    const r = (await h.scan(body, { rules: R }))[R[0]];
    console.log(k.padEnd(24), r.outcome, r.occ.map(o => `${o.rc}${o.d.metrics?JSON.stringify(o.d.metrics):''}`).join(';'), r.margin ? `m=${r.margin.value}/${r.margin.threshold} hr=${r.margin.headroom} ${r.margin.context.axis}` : '');
  }
  await h.close();
})();
