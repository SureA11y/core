const h = require('./h.js');
const R = ['link-in-text-block'];
const W = '<style>html{background:#fff}</style>';
const P = (a, pstyle='color:#000') => `${W}<p style="${pstyle}">Some text before ${a} and text after.</p>`;
const cases = {
  underline: P('<a href="#">link</a>'),
  none_low: P('<a href="#" style="text-decoration:none;color:#333">link</a>'),
  none_3_06: P('<a href="#" style="text-decoration:none;color:#0000ff">link</a>', 'color:#000'),
  child_span_underline: P('<a href="#" style="text-decoration:none;color:#222"><span style="text-decoration:underline">link</span></a>'),
  child_strong: P('<a href="#" style="text-decoration:none;color:#222"><strong>link</strong></a>'),
  child_em: P('<a href="#" style="text-decoration:none;color:#222"><em>link</em></a>'),
  transparent_underline: P('<a href="#" style="text-decoration-color:transparent;color:#222">link</a>'),
  transparent_border: P('<a href="#" style="text-decoration:none;color:#222;border-bottom:1px solid transparent">link</a>'),
  zero_border: P('<a href="#" style="text-decoration:none;color:#222;border-bottom:0 solid #000">link</a>'),
  same_bg_explicit: P('<a href="#" style="text-decoration:none;color:#222;background:#fff">link</a>'),
  paragraph_underlined: P('<a href="#" style="color:#222">link</a>', 'color:#000;text-decoration:underline'),
  link_in_span_wrapper: `${W}<p style="color:#000">Some text <span><a href="#" style="text-decoration:none;color:#222">link</a></span> after.</p>`,
  link_group_opacity: `<style>html{background:#000}</style><div style="opacity:.5"><p style="background:#fff;color:#000">Text <a href="#" style="text-decoration:none;color:#0000ee">link</a> after</p></div>`,
  link_bold_parent_bold: P('<a href="#" style="text-decoration:none;color:#222">link</a>', 'color:#000;font-weight:700'),
  oklch_link: P('<a href="#" style="text-decoration:none;color:oklch(0.5 0.2 260)">link</a>'),
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    const r = (await h.scan(body, { rules: R }))[R[0]];
    console.log(k.padEnd(22), r.outcome, r.occ.map(o => `${o.rc}${o.d && o.d.metrics ? '@' + (+o.d.metrics.ratio).toFixed(3) : ''}${o.d && o.d.colors ? '(' + o.d.colors.linkForegroundHex + '/' + o.d.colors.surroundingTextForegroundHex + ')' : ''}`).join('; '), r.margin ? `m=${r.margin.value.toFixed(3)}/${r.margin.threshold} n=${r.margin.measuredCount}` : '');
  }
  await h.close();
})();
