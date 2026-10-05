const h = require('./h.js');
const R = ['contrast-minimum','contrast-computable','link-in-text-block'];
const W = '<style>html{background:#fff}</style>';
const cases = {
  oklch_bg_dark: `${W}<div style="background:oklch(0.2 0 0)"><p id=t style="color:#ddd">Hello on dark oklch</p></div>`,
  lab_bg_dark: `${W}<div style="background:lab(10 0 0)"><p id=t style="color:#ddd">Hello on dark lab</p></div>`,
  p3_bg_dark: `${W}<div style="background:color(display-p3 0.1 0.1 0.1)"><p id=t style="color:#ddd">Hello</p></div>`,
  oklch_bg_dark_white: `${W}<div style="background:oklch(0.2 0 0)"><p id=t style="color:#fff">White on dark oklch</p></div>`,
  group_opacity_text_only: `<style>html{background:#000}</style><div style="opacity:.5"><p id=t style="background:#fff;color:#000">Hello</p></div>`,
  group_opacity_no_sameColorCheck: `<style>html{background:#000}</style><div style="opacity:.5"><p style="background:#fff"><span id=t style="color:#000">Hello</span></p></div>`,
  near_transparent: `${W}<p style="color:rgba(0,0,0,0.02)">Hello</p>`,
  large_24: `${W}<p style="font-size:24px;color:#949494">Hello</p>`, // 3.03 pass large
  large_23_99: `${W}<p style="font-size:23.99px;color:#949494">Hello</p>`, // fail
  bold_14pt_700: `${W}<p style="font-size:14pt;font-weight:700;color:#949494">Hello</p>`,
  bold_1866_700: `${W}<p style="font-size:18.66px;font-weight:700;color:#949494">Hello</p>`, // fail (below 18.667)
  bold_14pt_600: `${W}<p style="font-size:14pt;font-weight:600;color:#949494">Hello</p>`, // fail
  b_tag_14pt: `${W}<p style="font-size:14pt;color:#949494"><b>Hello</b></p>`,
  font_shorthand_bold_em: `${W}<p style="font:bold 1.1667em Arial;color:#949494">Hello</p>`,
  ratio_exact_45_like: `${W}<p style="color:#767676">x1</p>`,
  // white on #767676 bg 4.54; #777 4.48
  zoom2: `${W}<p style="zoom:2;font-size:12px;color:#949494">Hello zoom</p>`,
  scale_transform: `${W}<p style="transform:scale(2);transform-origin:0 0;font-size:12px;color:#949494">Hello scale</p>`,
  font_size_adjust: `${W}<p style="font-size:24px;font-size-adjust:0.2;color:#949494">Hello</p>`,
  hidden_scroll_offscreen_overflow: `${W}<div style="width:100px;overflow:hidden;white-space:nowrap"><span style="margin-left:500px;color:#eee">Hidden by scroll</span></div>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    const r = await h.scan(body, { rules: R });
    const s = R.slice(0,2).map(id => { const x = r[id]; const o = x.occ.filter(o=>o.rc && o.rc!=='ALL_ABOVE_THRESHOLD').map(o => `${o.rc}${o.d&&o.d.metrics&&o.d.metrics.ratio?'@'+o.d.metrics.ratio.toFixed(3):''}${o.d&&o.d.colors?'('+o.d.colors.foregroundHex+'/'+o.d.colors.backgroundHex+')':''}${o.d&&o.d.typography?' fs='+o.d.typography.fontSizePx+' w='+o.d.typography.fontWeight+' L='+o.d.typography.isLargeText:''}`).join(','); return `${id.replace('contrast-','')}=${x.outcome}${o?'['+o+']':''}${x.margin?' m='+x.margin.value.toFixed(3)+'/'+x.margin.threshold+(x.margin.context?JSON.stringify(x.margin.context):''):''}`; }).join('  ');
    console.log(k.padEnd(28), s);
  }
  await h.close();
})();
