const h = require('./h.js');
const R = ['text-spacing-content-loss'];
(async () => {
  for (const H of [22, 21, 20, 19.5, 19, 18.5, 18, 17]) {
    const r = (await h.scan(`<div style="height:${H}px;overflow:hidden;width:300px;font-size:16px;line-height:normal">Single line</div>`, { rules: R }))[R[0]];
    console.log('H', H, r.outcome, r.occ.map(o => `${o.rc}${JSON.stringify(o.d.metrics)}`).join(';'), r.margin ? `m=${r.margin.value}/${r.margin.threshold} hr=${r.margin.headroom}` : 'no margin');
  }
  for (const W of [160, 150, 140, 135, 130]) {
    const r = (await h.scan(`<button style="width:${W}px;height:30px;overflow:hidden;white-space:nowrap;padding:0;font:16px Arial">Subscribe now</button>`, { rules: R }))[R[0]];
    console.log('W', W, r.outcome, r.occ.map(o => `${o.rc}${JSON.stringify(o.d.metrics)}`).join(';'), r.margin ? `m=${r.margin.value}/${r.margin.threshold} hr=${r.margin.headroom} ${r.margin.context.axis}` : 'no margin');
  }
  await h.close();
})();
